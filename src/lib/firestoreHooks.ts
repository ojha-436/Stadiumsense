import { useEffect, useMemo, useState } from "react";
import {
  onSnapshot,
  type DocumentReference,
  type Query,
  type FirestoreError,
} from "firebase/firestore";

export interface AsyncData<T> {
  data: T;
  loading: boolean;
  error: FirestoreError | null;
}

/**
 * Subscribe to a single document with a realtime listener. Returns the mapped
 * value (with `id` hydrated by the caller's mapper) or null while absent.
 *
 * We use listeners everywhere rather than one-shot reads so every surface —
 * fan order tracking, vendor queue, ops heat map — updates live with no polling.
 */
export function useDocSnapshot<T>(
  ref: DocumentReference | null,
  map: (id: string, data: Record<string, unknown>) => T
): AsyncData<T | null> {
  const [state, setState] = useState<AsyncData<T | null>>({
    data: null,
    loading: true,
    error: null,
  });

  // Serialise the ref identity so the effect only re-subscribes on real change.
  const key = ref ? ref.path : null;

  useEffect(() => {
    if (!ref) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setState({
          data: snap.exists() ? map(snap.id, snap.data()) : null,
          loading: false,
          error: null,
        });
      },
      (error) => setState({ data: null, loading: false, error })
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

/** Subscribe to a query with a realtime listener, mapping each document. */
export function useCollectionSnapshot<T>(
  query: Query | null,
  map: (id: string, data: Record<string, unknown>) => T,
  deps: unknown[] = []
): AsyncData<T[]> {
  const [state, setState] = useState<AsyncData<T[]>>({
    data: [],
    loading: true,
    error: null,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoQuery = useMemo(() => query, deps);

  useEffect(() => {
    if (!memoQuery) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    const unsub = onSnapshot(
      memoQuery,
      (snap) => {
        setState({
          data: snap.docs.map((d) => map(d.id, d.data())),
          loading: false,
          error: null,
        });
      },
      (error) => setState({ data: [], loading: false, error })
    );
    return unsub;
  }, [memoQuery, map]);

  return state;
}
