import { useLanguageStore } from "../stores/languageStore";
import { useLocation } from "react-router-dom";

export function MystContentEmbed({ page }: { page: string }) {
  const { lang } = useLanguageStore();
  const hash = useLocation().hash;
  const srcHash = hash ? hash : "";
  return (
    <iframe
      key={`${lang}-${page}${srcHash}`}
      src={`/OpenScience/myst-content/${lang}/${page}/index.html${srcHash}`}
      title={`${lang}/${page}`}
      className="w-full border-0"
      style={{ minHeight: "100vh", height: "100%" }}
      sandbox="allow-same-origin allow-scripts allow-top-navigation"
    />
  );
}
