import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { Layout } from "./components/Layout";
import { HomePage, AboutPage } from "./pages";
import { MystContentEmbed } from "./components/MystContentEmbed";
import { toc } from "./config/toc";

function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 border-4 border-[#013243] border-t-transparent rounded-full" />
    </div>
  );
}

const allPages = Object.values(toc).flatMap((langToc) => [
  langToc.file,
  ...langToc.children.map((c) => c.path),
]);
const uniquePages = [...new Set(allPages)];

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename="/OpenScience">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              {uniquePages.map((page) => (
                <Route key={page} path={`/${page}`} element={<MystContentEmbed page={page} />} />
              ))}
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </I18nextProvider>
  );
}
