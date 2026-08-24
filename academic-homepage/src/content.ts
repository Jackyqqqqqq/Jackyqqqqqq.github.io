import type { SiteContent } from "./content.types";

export const siteContent: SiteContent = {
  identity: { name: { zh: "秦翊祯", en: "Qin Yizhen" }, role: { zh: "浙江大学软件学院 2026 级软件工程硕士研究生", en: "Incoming MEng Student in Software Engineering, Zhejiang University" }, location: { zh: "中国杭州", en: "Hangzhou, China" } },
  contact: { email: "qinyizhen8@gmail.com", github: "https://github.com/Jackyqqqqqq" },
  navigation: [
    ["about", "关于我", "About"], ["research", "研究兴趣", "Research Preference"], ["projects", "项目经历", "Projects"], ["education", "教育经历", "Education"], ["skills", "技能", "Skills"], ["contact", "联系方式", "Contact"]
  ].map(([id, zh, en]) => ({ id, label: { zh, en } })),
  about: [
    { zh: "我将于 2026 年秋季进入浙江大学软件学院攻读软件工程专业工学硕士学位；本科就读于武汉大学国家网络安全学院网络空间安全专业，获工学学士学位。", en: "I will begin an MEng in Software Engineering at the School of Software Technology, Zhejiang University, in fall 2026. I earned my BEng in Cyberspace Security at the School of Cyber Science and Engineering, Wuhan University." },
    { zh: "我的研究兴趣位于人工智能、软件工程与网络安全的交叉领域，关注可复现的机器学习实验、可信软件系统与隐私保护。", en: "My research interests lie at the intersection of artificial intelligence, software engineering, and cybersecurity, with a focus on reproducible machine-learning experiments, trustworthy software systems, and privacy protection." }
  ],
  research: [
    { title: { zh: "人工智能与深度学习", en: "AI and Deep Learning" }, description: { zh: "从模型复现到实验验证", en: "From model reproduction to experimental validation" }, intensity: 1 },
    { title: { zh: "隐私与信息隐藏", en: "Privacy and Information Hiding" }, description: { zh: "图像隐写与隐私传输", en: "Image steganography and private transmission" }, intensity: 0.82 },
    { title: { zh: "机器学习实验", en: "Machine-learning Experiments" }, description: { zh: "数据、方法与结果的可验证流程", en: "Verifiable workflows for data, methods, and results" }, intensity: 0.58 },
    { title: { zh: "可信软件系统", en: "Trustworthy Software Systems" }, description: { zh: "可靠、可复现与易维护", en: "Reliable, reproducible, and maintainable" }, intensity: 0.42 }
  ],
  projects: [
    { id: "covid-forecasting", title: { zh: "多维特征优化的新冠人数预测", en: "COVID-19 Case Forecasting with Feature Optimization" }, period: "2024.09-2024.12", tags: ["SelectKBest", "PCA", "SGD"], summary: { zh: "使用两类特征降维方法构建感染人数回归预测流程。", en: "A regression pipeline comparing two feature-reduction approaches." }, method: { zh: "使用 SelectKBest、PCA、带动量 SGD 与 L2 正则化 MSE。", en: "Used SelectKBest, PCA, momentum SGD, and L2-regularized MSE." }, result: { zh: "降低参数量与训练成本，加快收敛并保持预测准确性。", en: "Reduced cost and improved convergence while preserving accuracy." } },
    { id: "flower-classification", title: { zh: "基于半监督学习的花卉图像分类", en: "Semi-supervised Flower Classification" }, period: "2025.03-2025.06", tags: ["ResNet18", "Transfer Learning", "Pseudo-labeling"], summary: { zh: "在标注数据有限时利用无标签图像改进分类。", en: "Used unlabelled images to improve classification with limited labels." }, method: { zh: "采用自适应阈值选择伪标签，并微调预训练 ResNet18。", en: "Selected pseudo-labels adaptively and fine-tuned a pretrained ResNet18." }, result: { zh: "利用约 6000 张无标签图像提升准确率和训练稳定性。", en: "Used about 6,000 unlabelled images to improve accuracy and stability." } },
    { id: "hinet-steganography", title: { zh: "HiNet 图像隐写研究", en: "HiNet Image Steganography Study" }, period: "2025.01-2025.06", tags: ["Deep Learning", "Steganography", "Privacy"], summary: { zh: "复现可逆神经网络的图像隐藏与恢复。", en: "Reproduced image hiding and recovery with an invertible network." }, method: { zh: "加入 DataEncoder 与 DataDecoder 以支持二进制载荷。", en: "Added DataEncoder and DataDecoder for binary payloads." }, result: { zh: "扩展到二进制数据的隐私传输。", en: "Extended the method to private binary-data transmission." } }
  ],
  education: [
    { institution: { zh: "浙江大学", en: "Zhejiang University" }, school: { zh: "软件学院", en: "School of Software Technology" }, degree: { zh: "软件工程 · 工学硕士", en: "MEng in Software Engineering" }, period: "2026.09-2029.06", logo: "/university-logos/zhejiang-university.svg", logoAlt: { zh: "浙江大学校徽", en: "Zhejiang University emblem" }, details: [{ zh: "2026 级硕士研究生", en: "Entering Class of 2026" }] },
    { institution: { zh: "武汉大学", en: "Wuhan University" }, school: { zh: "国家网络安全学院", en: "School of Cyber Science and Engineering" }, degree: { zh: "网络空间安全 · 工学学士", en: "BEng in Cyberspace Security" }, period: "2022.09-2026.06", logo: "/university-logos/wuhan-university.svg", logoAlt: { zh: "武汉大学校徽", en: "Wuhan University emblem" }, details: [{ zh: "毕业论文：《车载网络安全加密技术验证与测试》", en: "Thesis: Verification and Testing of Encryption for In-Vehicle Networks" }, { zh: "国家级大学生创新训练项目", en: "National Undergraduate Innovation Training Program" }] }
  ],
  skills: {
    name: { zh: "技能", en: "Skills" },
    children: [
      {
        name: { zh: "编程语言", en: "Languages" },
        children: [
          { name: { zh: "Python", en: "Python" }, status: "owned" },
          { name: { zh: "C++", en: "C++" }, status: "owned" },
          { name: { zh: "SQL", en: "SQL" }, status: "learning" }
        ]
      },
      {
        name: { zh: "机器学习", en: "Machine Learning" },
        children: [
          { name: { zh: "深度学习", en: "Deep Learning" }, status: "owned" },
          { name: { zh: "计算机视觉", en: "Computer Vision" }, status: "owned" },
          { name: { zh: "自然语言处理", en: "NLP" }, status: "learning" },
          { name: { zh: "ResNet18", en: "ResNet18" }, status: "owned" },
          { name: { zh: "半监督学习", en: "Semi-supervised" }, status: "learning" }
        ]
      },
      {
        name: { zh: "安全与数据", en: "Security & Data" },
        children: [
          { name: { zh: "信息隐藏", en: "Information Hiding" }, status: "owned" },
          { name: { zh: "内容安全", en: "Content Security" }, status: "planned" },
          { name: { zh: "数据库", en: "Databases" }, status: "learning" }
        ]
      }
    ]
  },
  ui: {
    expand: { zh: "展开详情", en: "Show details" },
    collapse: { zh: "收起详情", en: "Hide details" },
    method: { zh: "方法", en: "Method" },
    result: { zh: "结果", en: "Result" },
    repository: { zh: "项目仓库", en: "Repository" },
    email: { zh: "邮箱", en: "Email" },
    github: { zh: "GitHub", en: "GitHub" },
    menu: { zh: "菜单", en: "Menu" },
    skipToContent: { zh: "跳到主要内容", en: "Skip to content" },
    displaySettings: { zh: "显示设置", en: "Display settings" },
    appearance: { zh: "外观", en: "Appearance" },
    appearanceAuto: { zh: "自动", en: "Auto" },
    appearanceBright: { zh: "明亮", en: "Bright" },
    appearanceSoft: { zh: "羊皮纸", en: "Parchment" },
    appearanceDark: { zh: "深色", en: "Dark" },
    accentColor: { zh: "主题色", en: "Accent color" },
    accentNavy: { zh: "藏青", en: "Navy" },
    accentForest: { zh: "墨绿", en: "Forest" },
    accentBurgundy: { zh: "酒红", en: "Burgundy" },
    accentViolet: { zh: "紫灰", en: "Violet grey" },
    fontSize: { zh: "字体大小", en: "Font size" },
    resetDisplay: { zh: "恢复默认", en: "Reset to default" },
    ongoingTitle: { zh: "更多研究进行中", en: "More in Progress" },
    ongoingNote: { zh: "新的项目正在酝酿，敬请期待。", en: "New work is being drafted — stay tuned." },
    skillOwned: { zh: "已掌握", en: "Owned" },
    skillLearning: { zh: "正在学习", en: "Learning" },
    skillPlanned: { zh: "计划学习", en: "Planned" }
  }
};
