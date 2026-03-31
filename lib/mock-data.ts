import { Contact, ContactInsight } from "@/types";

export const mockContacts: Contact[] = [
  {
    id: "c_001",
    name: "陈思源",
    company: "星澜智能制造",
    title: "销售总监",
    phone: "138-0000-1122",
    email: "siyuan.chen@stellarfab.cn",
    address: "上海市浦东新区张江高科技园区",
    website: "https://stellarfab.example.com",
    createdAt: "2026-03-28T09:20:00.000Z",
    recognizedAt: "2026-03-28T09:19:40.000Z",
    note: "在产业峰会交换名片，关注海外渠道合作。",
    cardImage:
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "c_002",
    name: "Lena Wu",
    company: "Northbridge Capital",
    title: "Investment Manager",
    phone: "+86 139 0000 2233",
    email: "lena.wu@northbridge.example.com",
    createdAt: "2026-03-27T14:44:00.000Z",
    recognizedAt: "2026-03-27T14:43:31.000Z",
    note: "关注工业软件和 AI 应用项目。",
    cardImage:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
  },
];

export const mockInsights: Record<string, ContactInsight> = {
  c_001: {
    companySummary:
      "星澜智能制造聚焦高端装备产线升级，典型客户多为离散制造企业，当前关键词是自动化改造、良率提升和出海。",
    companyNews: [
      "公司近期更强调产线升级、交付效率与海外业务拓展等方向，适合围绕制造升级和出海布局展开交流。",
      "从公开信息特征看，这类企业通常会重点关注客户案例、项目落地周期以及本地化服务能力。",
      "若暂无明确公开新闻，建议将关注点放在其当前重点业务、客户场景和增长计划上。",
    ],
    industryUpdates: [
      "制造业数字化转型预算逐步回暖，工厂对 ROI 更明确的改造方案更感兴趣。",
      "工业客户对 AI 的态度正在从概念验证转向单点场景落地，比如质检、运维和排产优化。",
      "出海工厂开始关注本地服务能力和交付周期，这可能影响供应商选择。",
    ],
    icebreakers: [
      "最近很多制造企业都在评估 AI 落地，贵司今年更看重提效还是降本？",
      "你们现在做海外渠道时，客户更关注交付能力还是本地化支持？",
      "展会上看到很多人在谈产线升级，贵司最近接触最多的需求是哪类？",
    ],
    followUps: [
      "后续可围绕具体行业案例展开，避免一上来直接推方案。",
      "如果用户要继续跟进，建议先发一条与其行业相关的短资讯再切入合作。",
    ],
    generatedAt: "2026-03-28T09:20:06.000Z",
    source: "mock",
  },
  c_002: {
    companySummary:
      "Northbridge Capital 是一家关注企业服务与产业科技的投资机构，偏好有明确商业化路径和行业客户验证的项目。",
    companyNews: [
      "这类投资机构近期通常更关注项目商业化验证、客户续费和现金流质量等信号。",
      "从市场环境看，机构沟通重点往往集中在行业主题、投资节奏和具体筛选标准。",
      "如果缺少单独的公司公开新闻，可优先围绕机构近期关注赛道和判断逻辑展开交流。",
    ],
    industryUpdates: [
      "一级市场对纯概念型 AI 项目更谨慎，更关注客户续费和真实部署深度。",
      "产业投资人开始关注 AI 与传统行业软件的结合，而非单点模型能力。",
      "资本市场对现金流和项目交付能力的重视程度明显提高。",
    ],
    icebreakers: [
      "最近很多机构在重新看 AI 项目，您现在最关注的是客户验证还是单位经济模型？",
      "产业科技项目里，您近期看到哪些赛道的 deal flow 明显变多了？",
      "如果从投资角度看，您更看重创始团队的行业理解还是销售能力？",
    ],
    followUps: [
      "后续交流可准备一页简洁业务数据，不建议直接长篇介绍技术细节。",
    ],
    generatedAt: "2026-03-27T14:44:10.000Z",
    source: "mock",
  },
};
