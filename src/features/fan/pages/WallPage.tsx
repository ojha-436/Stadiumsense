import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, Send, Vote } from "lucide-react";
import type { FanProfile, Poll } from "@/types/domain";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/features/auth/useAuth";
import { usePolls, usePublishedPosts } from "../wall/hooks";
import { castVote, createPost } from "../wall/actions";

export function WallPage({ profile }: { profile: FanProfile }): JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: posts } = usePublishedPosts(profile.matchId);
  const { data: polls } = usePolls(profile.matchId);
  const [caption, setCaption] = useState("");
  const [playerTag, setPlayerTag] = useState("");
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const share = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !caption.trim()) return;
    setSubmitting(true);
    try {
      // published:false — a Gemini moderation trigger reviews and publishes it.
      await createPost({
        matchId: profile.matchId,
        authorUid: user.uid,
        authorName: user.displayName ?? "Fan",
        caption: caption.trim(),
        playerTag: playerTag.trim() || undefined,
      });
      setCaption("");
      setPlayerTag("");
      setPending(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{t("wall.title")}</h1>

      <Card>
        <CardHeader>
          <MessageCircle className="h-5 w-5 text-flag-gold" aria-hidden="true" />
          <CardTitle>{t("wall.post")}</CardTitle>
        </CardHeader>
        {pending && (
          <Alert tone="info" className="mb-3">
            {t("wall.pendingModeration")}
          </Alert>
        )}
        <form onSubmit={share} className="flex flex-col gap-3">
          <Field label={t("wall.caption")} required>
            {(props) => (
              <Input
                {...props}
                value={caption}
                maxLength={280}
                onChange={(e) => setCaption(e.target.value)}
              />
            )}
          </Field>
          <Field label={t("wall.playerTag")}>
            {(props) => (
              <Input {...props} value={playerTag} onChange={(e) => setPlayerTag(e.target.value)} />
            )}
          </Field>
          <Button type="submit" loading={submitting} disabled={!caption.trim()} className="self-start">
            <Send className="h-4 w-4" aria-hidden="true" />
            {t("wall.share")}
          </Button>
        </form>
      </Card>

      {polls.length > 0 && (
        <Card>
          <CardHeader>
            <Vote className="h-5 w-5 text-flag-blue" aria-hidden="true" />
            <CardTitle>{t("wall.polls")}</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-4">
            {polls.map((poll) => (
              <PollCard key={poll.id} poll={poll} uid={user?.uid ?? ""} />
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {posts.map((post) => (
          <Card key={post.id}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.authorName}</span>
              {post.playerTag && <Badge tone="info">#{post.playerTag}</Badge>}
            </div>
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt={post.altText ?? post.caption}
                className="mt-2 max-h-72 w-full rounded-xl object-cover"
              />
            )}
            <p className="mt-2 text-night-50/90">{post.caption}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PollCard({ poll, uid }: { poll: Poll; uid: string }) {
  const { t } = useTranslation();
  const [voted, setVoted] = useState(false);
  const total = poll.options.reduce((s, o) => s + o.count, 0);

  const vote = async (optionId: string) => {
    if (!uid || voted) return;
    setVoted(true);
    // One vote doc per user, keyed by uid — enforced structurally by the rules.
    await castVote(poll.id, uid, optionId);
  };

  return (
    <div>
      <p className="mb-2 font-medium">{poll.question}</p>
      <div className="flex flex-col gap-2">
        {poll.options.map((opt) => {
          const pct = total > 0 ? Math.round((opt.count / total) * 100) : 0;
          return (
            <button
              key={opt.optionId}
              type="button"
              disabled={voted}
              onClick={() => void vote(opt.optionId)}
              className="relative overflow-hidden rounded-xl border border-surface-border p-3 text-left disabled:cursor-default"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 bg-flag-blue/20"
                style={{ width: voted ? `${pct}%` : "0%" }}
              />
              <span className="relative flex justify-between">
                <span>{opt.label}</span>
                {voted ? <span className="font-semibold">{pct}%</span> : <span>{t("wall.vote")}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {voted && <p className="mt-1 text-xs text-night-100">{t("wall.voted")}</p>}
    </div>
  );
}
