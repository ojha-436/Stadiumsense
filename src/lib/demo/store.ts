/**
 * In-memory reactive document store used only in demo mode. It mimics the small
 * slice of Firestore the app relies on (get, list, set, add, update, subscribe)
 * with realtime notifications, so the real components and hooks work unchanged.
 */
import { useMemo, useSyncExternalStore } from "react";
import { buildDemoCollections, type Collections } from "./data";

export interface StoredDoc {
  id: string;
  data: Record<string, unknown>;
}

const PERSIST_KEY = "stadiumsense.demo.store";
// Bump when the seed shape changes so stale persisted state is discarded.
const STORE_VERSION = 3;

class DemoStore {
  private cols: Collections;
  private listeners = new Set<() => void>();
  private seq = 0;
  version = 0;

  constructor() {
    this.cols = this.load() ?? buildDemoCollections(Date.now());
  }

  /** Rebuild collections from persisted JSON (survives full page reloads so the
   *  sign-up → approval flow works across navigations). Falls back to seed. */
  private load(): Collections | null {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(PERSIST_KEY) : null;
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        version: number;
        cols: Record<string, Array<[string, Record<string, unknown>]>>;
      };
      if (parsed.version !== STORE_VERSION) return null;
      const cols: Collections = {};
      for (const [name, entries] of Object.entries(parsed.cols)) cols[name] = new Map(entries);
      return cols;
    } catch {
      return null;
    }
  }

  private persist() {
    try {
      if (typeof localStorage === "undefined") return;
      const cols: Record<string, Array<[string, Record<string, unknown>]>> = {};
      for (const [name, map] of Object.entries(this.cols)) cols[name] = [...map.entries()];
      localStorage.setItem(PERSIST_KEY, JSON.stringify({ version: STORE_VERSION, cols }));
    } catch {
      /* storage full / unavailable — non-fatal for a demo */
    }
  }

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getVersion = (): number => this.version;

  private bump() {
    this.version += 1;
    this.persist();
    this.listeners.forEach((cb) => cb());
  }

  private col(name: string): Map<string, Record<string, unknown>> {
    let c = this.cols[name];
    if (!c) {
      c = new Map();
      this.cols[name] = c;
    }
    return c;
  }

  list(name: string): StoredDoc[] {
    return [...this.col(name).entries()].map(([id, data]) => ({ id, data }));
  }

  get(name: string, id: string): StoredDoc | null {
    const data = this.col(name).get(id);
    return data ? { id, data } : null;
  }

  set(name: string, id: string, data: Record<string, unknown>): void {
    this.col(name).set(id, { ...data });
    this.bump();
  }

  add(name: string, data: Record<string, unknown>): string {
    // Timestamp + counter keeps ids unique even across persisted reloads.
    const id = `demo-${name}-${Date.now()}-${++this.seq}`;
    this.col(name).set(id, { ...data });
    this.bump();
    return id;
  }

  update(name: string, id: string, patch: Record<string, unknown>): void {
    const cur = this.col(name).get(id);
    if (!cur) return;
    this.col(name).set(id, { ...cur, ...patch });
    this.bump();
  }
}

export const demoStore = new DemoStore();

type Mapper<T> = (id: string, data: Record<string, unknown>) => T;

/** Realtime list subscription with optional filter/sort, mirroring AsyncData. */
export function useDemoCollection<T>(
  name: string,
  map: Mapper<T>,
  opts: {
    filter?: (data: Record<string, unknown>) => boolean;
    sort?: (a: T, b: T) => number;
    deps?: unknown[];
  } = {}
): { data: T[]; loading: boolean; error: null } {
  const version = useSyncExternalStore(demoStore.subscribe, demoStore.getVersion);
  const { filter, sort, deps = [] } = opts;
  const data = useMemo(() => {
    let docs = demoStore.list(name);
    if (filter) docs = docs.filter((d) => filter(d.data));
    const mapped = docs.map((d) => map(d.id, d.data));
    if (sort) mapped.sort(sort);
    return mapped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, name, ...deps]);
  return { data, loading: false, error: null };
}

/** Realtime single-doc subscription, mirroring AsyncData. */
export function useDemoDoc<T>(
  name: string,
  id: string | null,
  map: Mapper<T>
): { data: T | null; loading: boolean; error: null } {
  const version = useSyncExternalStore(demoStore.subscribe, demoStore.getVersion);
  const data = useMemo(() => {
    if (!id) return null;
    const doc = demoStore.get(name, id);
    return doc ? map(doc.id, doc.data) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, name, id]);
  return { data, loading: false, error: null };
}
