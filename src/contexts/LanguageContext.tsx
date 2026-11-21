import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Baity Business is Arabic-first with English. Every string is written inline
// as tr("عربي", "English"), so a screen reads in both languages at once and
// nothing can go missing from a separate dictionary.
export type Lang = "ar" | "en";

interface LanguageContextType {
  lang: Lang;
  isRTL: boolean;
  setLang: (l: Lang) => void;
  tr: (ar: string, en: string) => string;
}

const KEY = "bb_language";

function readLang(): Lang {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  isRTL: true,
  setLang: () => {},
  tr: (ar) => ar,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // Private mode: the choice lasts for this visit only.
    }
  };

  return (
    <LanguageContext.Provider
      value={{ lang, isRTL: lang === "ar", setLang, tr: (ar, en) => (lang === "ar" ? ar : en) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
