export interface TocChild {
  label: string;
  path: string;
}

export interface LangToc {
  section: string;
  file: string;
  children: TocChild[];
}

export const toc: Record<string, LangToc> = {
  en: {
    section: "Writing Template - English Content (EN)",
    file: "intro",
    children: [
      { label: "Writing Guide", path: "writing-guide" },
      { label: "Basic Template", path: "writing-template-basic" },
      { label: "Code Template", path: "writing-template-code" },
      { label: "MOF Basics", path: "ch1-mof-basics" },
      { label: "MOF Advanced", path: "ch2-mof-advanced" },
    ],
  },
  zh: {
    section: "写作模板-中文内容 (ZH)",
    file: "intro",
    children: [
      { label: "写作指南", path: "writing-guide" },
      { label: "基础模板", path: "writing-template-basic" },
      { label: "代码模板", path: "writing-template-code" },
      { label: "MOF 基础", path: "ch1-mof-basics" },
      { label: "MOF 进阶", path: "ch2-mof-advanced" },
    ],
  },
};
