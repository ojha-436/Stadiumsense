import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, Send, Sparkles } from "lucide-react";
import type { Lang } from "@/types/domain";
import type { OpsChatMessage } from "@/types/contracts";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { logger } from "@/lib/logger";

interface ChatTurn extends OpsChatMessage {
  sources?: string[];
}

/**
 * Operator assistant. Answers are produced by the `opsChat` gateway strictly
 * from fan-supplied data (profiles, orders, fan-reported incidents), so the
 * operator gets grounded, source-attributed responses — not open-ended chat.
 */
export function OpsChat({ matchId, lang }: { matchId: string; lang: Lang }): JSX.Element {
  const { t } = useTranslation();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const suggestions = [t("ops.chatQ1"), t("ops.chatQ2"), t("ops.chatQ3")];

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const history: OpsChatMessage[] = turns.map(({ role, content }) => ({ role, content }));
    setTurns((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await api.opsChat({ matchId, question: q, history, lang });
      setTurns((prev) => [...prev, { role: "assistant", content: res.answer, sources: res.sources }]);
    } catch (err) {
      logger.error("Ops chat request failed", err);
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: t("common.error"), sources: [] },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }));
    }
  };

  return (
    <Card className="border-accent-2/30">
      <CardHeader>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-2/15 text-accent-2">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <CardTitle>{t("ops.chatTitle")}</CardTitle>
          <p className="text-xs text-fg-muted">{t("ops.chatSubtitle")}</p>
        </div>
      </CardHeader>

      <div
        ref={logRef}
        className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1"
        aria-live="polite"
      >
        {turns.length === 0 && (
          <p className="flex items-start gap-2 rounded-xl bg-inset p-3 text-sm text-fg-muted">
            <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
            {t("ops.chatIntro")}
          </p>
        )}
        {turns.map((turn, i) => (
          <div
            key={i}
            className={cn("flex", turn.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                turn.role === "user"
                  ? "bg-primary text-white"
                  : "border border-surface-border bg-inset text-fg"
              )}
            >
              <p>{turn.content}</p>
              {turn.sources && turn.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wide text-fg-muted">
                    {t("ops.chatSources")}:
                  </span>
                  {turn.sources.map((s) => (
                    <Badge key={s} tone="info" className="text-[10px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {turns.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void ask(s)}
              className="rounded-full border border-surface-border px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-accent-2 hover:text-fg"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <label htmlFor="ops-chat-input" className="sr-only">
          {t("ops.chatPlaceholder")}
        </label>
        <input
          id="ops-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("ops.chatPlaceholder")}
          className="h-11 flex-1 rounded-xl border border-surface-border bg-inset px-3 text-fg placeholder:text-fg-muted/50"
        />
        <Button type="submit" size="md" loading={busy} disabled={!input.trim()} aria-label={t("ops.chatSend")}>
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </Card>
  );
}
