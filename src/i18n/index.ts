import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    resources: {
      en: {
        translation: {
          "nav.guide": "Guide",
          "nav.projects": "Projects",
          "nav.about": "About",
          "hero.welcome": "Welcome to Open Science",
          "hero.subtitle": "An open-source knowledge database, interactive, neural network formation, with AI",
          "hero.getStarted": "Get Started",
          "language.switchTo": "中文",
          "chat.title": "AI Assistant",
          "chat.placeholder": "Ask a question...",
          "chat.send": "Send",
          "chat.demoResponse": "Thank you for your question! This is a demo mode. The LLM API will be connected in the future to provide real AI responses.",
          "chat.demoResponseZh": "感谢您的提问！当前为演示模式，LLM API 接入后将提供真实的 AI 回复。",
          "footer.text": "This is a new footer.",
        },
      },
      zh: {
        translation: {
          "nav.guide": "指南",
          "nav.projects": "项目",
          "nav.about": "关于",
          "hero.welcome": "欢迎来到 Open Science",
          "hero.subtitle": "开源知识数据库，交互式神经网络构建，融合 AI",
          "hero.getStarted": "开始阅读",
          "language.switchTo": "English",
          "chat.title": "AI 助手",
          "chat.placeholder": "输入您的问题...",
          "chat.send": "发送",
          "chat.demoResponse": "感谢您的提问！当前为演示模式，LLM API 接入后将提供真实的 AI 回复。",
          "chat.demoResponseEn": "Thank you for your question! This is a demo mode. The LLM API will be connected in the future to provide real AI responses.",
          "footer.text": "这是新的页脚。",
        },
      },
    },
  });

export default i18n;
