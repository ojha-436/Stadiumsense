import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGS, type Lang } from "@/types/domain";
import { LANG_LABELS, setLanguage } from "@/i18n";
import { Select } from "@/components/ui/Field";

/** Compact language selector available in the app header on every surface.
 *  The label is visually hidden but present for screen readers. */
export function LanguageSwitcher(): JSX.Element {
  const { i18n, t } = useTranslation();
  const id = useId();
  const current = (i18n.resolvedLanguage as Lang) ?? "en";

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-night-100" aria-hidden="true" />
      <label htmlFor={id} className="sr-only">
        {t("app.language")}
      </label>
      <Select
        id={id}
        value={current}
        onChange={(e) => setLanguage(e.target.value as Lang)}
        className="h-9 w-auto py-0"
      >
        {SUPPORTED_LANGS.map((lang) => (
          <option key={lang} value={lang}>
            {LANG_LABELS[lang]}
          </option>
        ))}
      </Select>
    </div>
  );
}
