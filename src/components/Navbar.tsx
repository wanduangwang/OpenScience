import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

const projects = [
  { title: "General Chemistry", url: "https://openscienceteam.github.io/General-Chemistry/" },
  { title: "Generative Models for Materials Science", url: "https://openscienceteam.github.io/aiforscience/" },
  { title: "Electrochemical", url: "https://openscienceteam.github.io/electrochemical/" },
];

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const projectsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (projectsRef.current && !projectsRef.current.contains(e.target as Node)) setProjectsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#013243] text-white sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 no-underline text-white shrink-0">
            <img src="/OpenScience/favicon.ico" alt="logo" className="h-8 w-8" />
            <span className="font-bold text-lg">Open Science</span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/intro"
              className={`no-underline text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                location.pathname === "/intro" || location.pathname.startsWith("/writing-") || location.pathname.startsWith("/ch")
                  ? "text-white bg-white/10"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              {t("nav.guide")}
            </Link>

            <div ref={projectsRef} className="relative">
              <button
                onClick={() => setProjectsOpen(!projectsOpen)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md text-white/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span>{t("nav.projects")}</span>
                <svg className={`w-3 h-3 transition-transform ${projectsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {projectsOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {projects.map((p) => (
                    <a
                      key={p.title}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#013243] no-underline"
                    >
                      {p.title}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/about"
              className={`no-underline text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                location.pathname === "/about"
                  ? "text-white bg-white/10"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              {t("nav.about")}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/OpenScienceTeam"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-block text-sm text-white/80 hover:text-white no-underline"
          >
            OpenScienceTeam
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
