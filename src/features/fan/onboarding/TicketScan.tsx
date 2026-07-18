import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ref as storageRef, uploadBytes } from "firebase/storage";
import { Upload } from "lucide-react";
import { storage } from "@/lib/firebase";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Field, Input } from "@/components/ui/Field";
import { logger } from "@/lib/logger";
import type { Match, TransportMode } from "@/types/domain";
import type { ProfileDraft } from "./saveProfile";

type Phase = "idle" | "uploading" | "confirm" | "error";

/** Ticket scan path: upload the image, let Gemini Vision read it, then let the
 *  fan confirm/correct the parsed fields before the profile is saved. */
export function TicketScan({
  uid,
  matches,
  submitting,
  onSubmit,
}: {
  uid: string;
  matches: Match[];
  submitting: boolean;
  onSubmit: (draft: ProfileDraft) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [matchId, setMatchId] = useState(matches[0]?.id ?? "");
  const [section, setSection] = useState("");
  const [row, setRow] = useState("");
  const [seat, setSeat] = useState("");
  const [gate, setGate] = useState("");

  const handleFile = async (file: File) => {
    setPhase("uploading");
    try {
      const path = `tickets/${uid}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      await uploadBytes(storageRef(storage, path), file);
      const parsed = await api.parseTicket({ imagePath: path });
      if (parsed.matchId && matches.some((m) => m.id === parsed.matchId)) setMatchId(parsed.matchId);
      setSection(parsed.seat.section ?? "");
      setRow(parsed.seat.row ?? "");
      setSeat(parsed.seat.seat ?? "");
      setGate(parsed.seat.gate ?? "");
      setPhase("confirm");
    } catch (err) {
      logger.error("Failed to scan ticket", err);
      setPhase("error");
    }
  };

  const save = () => {
    onSubmit({
      matchId,
      seat: gate ? { section, row, seat, gate } : { section, row, seat },
      transportMode: "transit" as TransportMode,
      partySize: 1,
      accessibilityNeeds: [],
      source: "scan",
    });
  };

  if (phase === "uploading") {
    return <Spinner label={t("onboarding.scanning")} className="justify-center py-8" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {phase === "error" && <Alert tone="warning">{t("onboarding.scanFailed")}</Alert>}

      {phase !== "confirm" ? (
        <>
          <p className="text-sm text-night-100">{t("onboarding.scanPrompt")}</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button variant="secondary" block onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            {t("onboarding.uploadTicket")}
          </Button>
        </>
      ) : (
        <>
          <h3 className="font-semibold">{t("onboarding.confirmTitle")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("onboarding.section")} required>
              {(props) => (
                <Input {...props} value={section} onChange={(e) => setSection(e.target.value)} />
              )}
            </Field>
            <Field label={t("onboarding.gate")}>
              {(props) => <Input {...props} value={gate} onChange={(e) => setGate(e.target.value)} />}
            </Field>
            <Field label={t("onboarding.row")}>
              {(props) => <Input {...props} value={row} onChange={(e) => setRow(e.target.value)} />}
            </Field>
            <Field label={t("onboarding.seat")}>
              {(props) => <Input {...props} value={seat} onChange={(e) => setSeat(e.target.value)} />}
            </Field>
          </div>
          <Button block loading={submitting} disabled={!section} onClick={save}>
            {t("onboarding.save")}
          </Button>
        </>
      )}
    </div>
  );
}
