import { Link, useLocation } from "react-router-dom";
import { useLanguageStore } from "../stores/languageStore";
import { toc } from "../config/toc";

export function Sidebar() {
  const { lang } = useLanguageStore();
  const location = useLocation();
  const section = toc[lang];

  const parentPath = `/${section.file}`;

  const isParentActive = location.pathname === parentPath;
  const children = section.children.map((c) => {
    const path = `/${c.path}`;
    const isActive = location.pathname.startsWith(path);
    return { label: c.label, path, isActive };
  });

  const anyChildActive = children.some((c) => c.isActive);

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white hidden lg:block">
      <div className="sticky top-16 overflow-y-auto max-h-[calc(100vh-4rem)] p-4">
        <nav className="space-y-1">
          <Link
            to={parentPath}
            className={`block px-3 py-2 rounded-lg text-sm font-semibold no-underline transition-colors ${
              isParentActive && !anyChildActive
                ? "bg-[#013243]/10 text-[#013243]"
                : "text-gray-900 hover:bg-gray-100"
            }`}
          >
            {section.section}
          </Link>

          <div className="ml-3 border-l border-gray-200 pl-2 space-y-1">
            {children.map((child) => (
              <Link
                key={child.path}
                to={child.path}
                className={`block px-3 py-1.5 rounded-lg text-sm no-underline transition-colors ${
                  child.isActive
                    ? "bg-[#013243]/10 text-[#013243] font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
}
