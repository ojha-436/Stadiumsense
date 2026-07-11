import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { AccessibilityNeed, Match, TransportMode } from "@/types/domain";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { formatTime } from "@/lib/format";
import type { Lang } from "@/types/domain";
import type { ProfileDraft } from "./saveProfile";

const TRANSPORT: TransportMode[] = ["transit", "driving", "walking", "rideshare"];
const NEEDS: AccessibilityNeed[] = [
  "wheelchair",
  "step-free",
  "low-vision",
  "hearing",
  "sensory-friendly",
];

/** Accessible multi-input questionnaire — the guaranteed path to a profile when
 *  a ticket can't be scanned. All controls are labelled and keyboard-operable. */
export function Questionnaire({
  matches,
  lang,
  submitting,
  onSubmit,
}: {
  matches: Match[];
  lang: Lang;
  submitting: boolean;
  onSubmit: (draft: ProfileDraft) => void;
}) {
  const { t } = useTranslation();
  const [matchId, setMatchId] = useState(matches[0]?.id ?? "");
  const [section, setSection] = useState("");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  const [startAddress, setStartAddress] = useState("");
  const [transportMode, setTransportMode] = useState<TransportMode>("transit");
  const [partySize, setPartySize] = useState(1);
  const [needs, setNeeds] = useState<AccessibilityNeed[]>([]);

  const toggleNeed = (need: AccessibilityNeed) =>
    setNeeds((prev) => (prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      matchId,
      seat: { section, row, seat, gate: undefined },
      startAddress: startAddress || undefined,
      transportMode,
      partySize,
      accessibilityNeeds: needs,
      source: "questionnaire",
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label={t("onboarding.match")} required>
        {(props) => (
          <Select {...props} value={matchId} onChange={(e) => setMatchId(e.target.value)} required>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.home.teamName} v {m.away.teamName} — {formatTime(m.kickoff, lang)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label={t("onboarding.section")} required>
          {(props) => (
            <Input {...props} value={section} onChange={(e) => setSection(e.target.value)} required />
          )}
        </Field>
        <Field label={t("onboarding.row")}>
          {(props) => <Input {...props} value={row} onChange={(e) => setRow(e.target.value)} />}
        </Field>
        <Field label={t("onboarding.seat")}>
          {(props) => <Input {...props} value={seat} onChange={(e) => setSeat(e.target.value)} />}
        </Field>
      </div>

      <Field label={t("onboarding.startAddress")} hint={t("onboarding.startAddressHint")}>
        {(props) => (
          <Input
            {...props}
            value={startAddress}
            onChange={(e) => setStartAddress(e.target.value)}
            autoComplete="street-address"
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("onboarding.transport")}>
          {(props) => (
            <Select
              {...props}
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value as TransportMode)}
            >
              {TRANSPORT.map((mode) => (
                <option key={mode} value={mode}>
                  {t(`transport.${mode}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("onboarding.partySize")}>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={1}
              max={20}
              value={partySize}
              onChange={(e) => setPartySize(Math.max(1, Number(e.target.value)))}
            />
          )}
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-night-100">
          {t("onboarding.accessibility")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {NEEDS.map((need) => {
            const active = needs.includes(need);
            return (
              <button
                key={need}
                type="button"
                aria-pressed={active}
                onClick={() => toggleNeed(need)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                  (active
                    ? "border-pitch-500 bg-pitch-500/20 text-pitch-400"
                    : "border-surface-border text-night-100 hover:border-night-100")
                }
              >
                {t(`access.${need}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Button type="submit" block loading={submitting} disabled={!matchId || !section}>
        {submitting ? t("onboarding.saving") : t("onboarding.save")}
      </Button>
    </form>
  );
}
