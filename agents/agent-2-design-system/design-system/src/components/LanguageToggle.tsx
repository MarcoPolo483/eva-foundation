import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const current = i18n.language.startsWith("fr") ? "fr" : "en";

  const changeLanguage = (lang: "en" | "fr") => {
    i18n.changeLanguage(lang);
    // localStorage caching is handled by the language detector
  };

  return (
    <div aria-label="Language selector" className="inline-flex rounded border border-gray-300">
      <button
        type="button"
        onClick={() => changeLanguage("en")}
        className={`px-3 py-1 text-xs ${
          current === "en"
            ? "font-semibold"
            : "text-gray-500"
        }`}
        aria-pressed={current === "en"}
      >
        {t("language.english")}
      </button>
      <button
        type="button"
        onClick={() => changeLanguage("fr")}
        className={`px-3 py-1 text-xs border-l border-gray-300 ${
          current === "fr"
            ? "font-semibold"
            : "text-gray-500"
        }`}
        aria-pressed={current === "fr"}
      >
        {t("language.french")}
      </button>
    </div>
  );
}
