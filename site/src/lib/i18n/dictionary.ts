export type Locale = 'en' | 'zh';

export const locales: Locale[] = ['en', 'zh'];

export const localeNames: Record<Locale, string> = {
  en: 'EN',
  zh: '中文',
};

export type Dictionary = typeof dictionary.en;

export const dictionary = {
  en: {
    /* Header */
    'nav.home': 'Home',
    'nav.guide': 'Guide',
    'nav.about': 'About',
    'nav.projects': 'Projects',
    'nav.openMenu': 'Open menu',
    'project.generalChemistry': 'General Chemistry',
    'project.aiForMaterials': 'AI for Materials Science',
    'project.electrochemistry': 'Electrochemistry',
    'project.quantumMechanics': 'Quantum Mechanics',

    /* Home Page */
    'home.hero.title': 'Welcome to',
    'home.hero.titleHighlight': 'Open Science',
    'home.hero.subtitle': 'An open-source knowledge database, interactive, neural network formation, with AI',
    'home.hero.cta': 'Get Started',
    'home.about.title': 'About Open Science',
    'home.about.body':
      'We are building an open-science knowledge initiative at UC Berkeley BIDMaP. Our vision is a multilingual open knowledge infrastructure for STEM learning in the AI and LLM era. We aim to make scientific knowledge high-quality, authoritative, expert-edited, and freely accessible.',
    'home.goals.title': 'Our Goals',
    'home.goals.open.title': 'Open by Default',
    'home.goals.open.desc': 'No paywalls, no fees, and no artificial barriers to scientific knowledge.',
    'home.goals.community.title': 'Built by Community',
    'home.goals.community.desc': 'Transparent, open-source collaboration with expert review at the center.',
    'home.goals.global.title': 'Global and Multilingual',
    'home.goals.global.desc': 'Resources designed for students, educators, and researchers across languages and regions.',
    'home.projects.title': 'Our Projects',
    'home.projects.writingGuide': 'Writing Info & Guide',

    /* About Page */
    'about.title': 'Our Team',
    'about.contributors': 'Contributor/Committee',
    'about.supporters': 'Supporters and Collaborators',

    /* Footer */
    'footer.text': 'Open-science project 2026, open to everyone in the AI era.',
    'footer.github': 'GitHub',

    /* Language */
    'lang.switchTo': 'English',

    /* AI Chat */
    'chat.title': 'AI Chat',
    'chat.placeholder': 'Ask me anything...',
    'chat.send': 'Send',
    'chat.thinking': 'Thinking...',
    'chat.error': 'Sorry, something went wrong. Please try again.',
    'chat.clear': 'Clear conversation',
    'chat.clearConfirm': 'Clear this conversation?',
    'chat.newConversation': 'New conversation',
    'chat.welcome': 'Hello! I\'m the OpenScience AI assistant. How can I help you today?',
    'chat.modelLabel': 'Model',
    'chat.modelDefault': 'Default',
    'chat.close': 'Close chat',
  },

  zh: {
    /* Header */
    'nav.home': '首页',
    'nav.guide': '指南',
    'nav.about': '关于',
    'nav.projects': '项目',
    'nav.openMenu': '打开菜单',
    'project.generalChemistry': 'General Chemistry',
    'project.aiForMaterials': 'AI for Materials Science',
    'project.electrochemistry': 'Electrochemistry',
    'project.quantumMechanics': 'Quantum Mechanics',

    /* Home Page */
    'home.hero.title': '欢迎来到',
    'home.hero.titleHighlight': 'Open Science',
    'home.hero.subtitle': '开源知识数据库，交互式、神经网络式构建，AI 驱动',
    'home.hero.cta': '开始阅读',
    'home.about.title': '关于 Open Science',
    'home.about.body':
      '我们正在 UC Berkeley BIDMaP 发起一项开放科学知识计划。我们的愿景是建立一个多语言、开放的知识基础设施，用于 AI 和大模型时代的 STEM 学习。我们的目标是让科学知识高质量、权威、经专家编辑，并且免费可访问。',
    'home.goals.title': '我们的目标',
    'home.goals.open.title': '默认开放',
    'home.goals.open.desc': '没有付费墙、没有费用、没有人为障碍——让科学知识自由流通。',
    'home.goals.community.title': '社区共建',
    'home.goals.community.desc': '透明、开源的协作模式，以专家评审为核心。',
    'home.goals.global.title': '全球多语言',
    'home.goals.global.desc': '面向全球学生、教育者和研究者的资源，跨越语言和地域限制。',
    'home.projects.title': '我们的项目',
    'home.projects.writingGuide': '写作信息与指南',

    /* About Page */
    'about.title': '我们的团队',
    'about.contributors': '贡献者 / 委员会',
    'about.supporters': '支持者与合作伙伴',

    /* Footer */
    'footer.text': '开放科学项目 2026，AI 时代向所有人开放。',
    'footer.github': 'GitHub',

    /* Language */
    'lang.switchTo': '中文',

    /* AI Chat */
    'chat.title': 'AI 问答',
    'chat.placeholder': '输入你的问题...',
    'chat.send': '发送',
    'chat.thinking': '思考中...',
    'chat.error': '抱歉，出了点问题，请重试。',
    'chat.clear': '清除对话',
    'chat.clearConfirm': '确定清除当前对话？',
    'chat.newConversation': '新对话',
    'chat.welcome': '你好！我是 OpenScience AI 助手，有什么可以帮助你的？',
    'chat.modelLabel': '模型',
    'chat.modelDefault': '默认',
    'chat.close': '关闭对话',
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionary[locale];
}
