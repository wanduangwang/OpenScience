import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLanguageStore, languages, type Language } from "../stores/languageStore";
import i18n from "../i18n";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguageStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = languages.find((l) => l.code === lang) ?? languages[0];

  const handleSelect = (code: Language) => {
    if (code !== lang) {
      setLang(code);
      i18n.changeLanguage(code);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-white/30 rounded-md text-white/90 hover:bg-white/10 transition-colors cursor-pointer"
      >
        <span>{current.native}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => handleSelect(l.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${
                l.code === lang ? "text-[#013243] font-semibold bg-gray-50" : "text-gray-700"
              }`}
            >
              <span className="text-xs text-gray-400 w-5">{l.code === lang ? "✓" : ""}</span>
              <span>{l.native}</span>
              <span className="text-xs text-gray-400 ml-auto">{l.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
