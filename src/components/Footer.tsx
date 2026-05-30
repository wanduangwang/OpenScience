import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-[#013243] text-white px-8 py-6 mt-auto">
      <div className="max-w-[1200px] mx-auto">
        <p className="text-sm text-white/80">{t("footer.text")}</p>
      </div>
    </footer>
  );
}
