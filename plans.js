// 学分统计系统 V2 数据骨架
// 板块缩写说明：
//   core       核心通识课程
//   aesthetic  美育
//   ge         选修通识课程
//   seminar    新生研讨课
//   politics   政治理论与思想品德
//   pe         体育与健康
//   math       数学（C类）
//   info       信息技术基础
//   econlaw    经管法基础
//   career     职业发展与创新创业
//   majorReq   学科基础必修课
//   majorOpt   学科基础选修课
//   dirReq     专业方向必修课

window.UIBE_PLANS = {
  years: {
    "2023": {
      label: "2023 届",
      doublePrograms: [
        { id: "law", label: "法学–英语类", enabled: true },
        { id: "finance", label: "金融学–英语类", enabled: true },
        { id: "accounting", label: "英语类–会计学", enabled: false }
      ],
      doubleReq: {
        law: { base: 73, opt: 33, dir: 24, pro: 130, ge: 48, course: 178, practice: 28, total: 206 },
        finance: { base: 73, opt: 16, dir: 30, pro: 119, ge: 64, course: 183, practice: 28, total: 211 },
        accounting: { base: 67, opt: 16, dir: 26, pro: 109, ge: 64, course: 173, practice: 28, total: 201 }
      },
      mainTracks: [
        { id: "english-lit", label: "英语（文学方向）", degree: "英语专业" },
        { id: "english-lin", label: "英语（语言学方向）", degree: "英语专业" },
        { id: "english-media", label: "英语（国际传播方向）", degree: "英语专业" },
        { id: "translation", label: "翻译", degree: "翻译专业" },
        { id: "business-english", label: "商务英语", degree: "商务英语专业" }
      ]
    },
    "2024": {
      label: "2024 届",
      doublePrograms: [
        { id: "law", label: "法学–英语类", enabled: true },
        { id: "finance", label: "金融学–英语类", enabled: true },
        { id: "accounting", label: "英语类–会计学", enabled: true }
      ],
      doubleReq: {
        law: { base: 73, opt: 33, dir: 24, pro: 130, ge: 48, course: 178, practice: 28, total: 206 },
        finance: { base: 73, opt: 16, dir: 30, pro: 119, ge: 64, course: 183, practice: 28, total: 211 },
        accounting: { base: 67, opt: 16, dir: 26, pro: 109, ge: 64, course: 173, practice: 28, total: 201 }
      },
      mainTracks: [
        { id: "english-lit", label: "英语（文学方向）", degree: "英语专业" },
        { id: "english-lin", label: "英语（语言学方向）", degree: "英语专业" },
        { id: "english-media", label: "英语（国际传播方向）", degree: "英语专业" },
        { id: "translation", label: "翻译", degree: "翻译专业" },
        { id: "business-english", label: "商务英语", degree: "商务英语专业" }
      ]
    },
    "2025": {
      label: "2025 届",
      doublePrograms: [
        { id: "law", label: "法学–英语类", enabled: true },
        { id: "finance", label: "金融学–英语类", enabled: true },
        { id: "accounting", label: "英语类–会计学", enabled: true }
      ],
      doubleReq: {
        law: { base: 73, opt: 33, dir: 24, pro: 130, ge: 48, course: 178, practice: 28, total: 206 },
        finance: { base: 73, opt: 16, dir: 30, pro: 119, ge: 64, course: 183, practice: 28, total: 211 },
        accounting: { base: 67, opt: 16, dir: 26, pro: 109, ge: 64, course: 173, practice: 28, total: 201 }
      },
      mainTracks: [
        { id: "english-lit", label: "英语（文学方向）", degree: "英语专业" },
        { id: "english-lin", label: "英语（语言学方向）", degree: "英语专业" },
        { id: "english-media", label: "英语（国际传播方向）", degree: "英语专业" },
        { id: "translation", label: "翻译", degree: "翻译专业" },
        { id: "business-english", label: "商务英语", degree: "商务英语专业" }
      ]
    }
  },

  // 通识/通修各板块要求（2023-2025 届一致，暂先共用）
  commonBlocks: [
    { key: "core", label: "核心通识课程", req: 4 },
    { key: "aesthetic", label: "美育", req: 2 },
    { key: "ge", label: "选修通识课程", req: 8 },
    { key: "seminar", label: "新生研讨课", req: 1 },
    { key: "politics", label: "政治理论与思想品德", req: 19 },
    { key: "pe", label: "体育与健康", req: 4 },
    { key: "math", label: "数学（C类）", req: 4 },
    { key: "info", label: "信息技术基础", req: 4 },
    { key: "econlaw", label: "经管法基础", req: 6 },
    { key: "career", label: "职业发展与创新创业", req: 2 }
  ],

  // 实践教学板块
  practiceBlocks: [
    { key: "exp", label: "实验课", req: 10 },
    { key: "labor", label: "劳动教育", req: 2 },
    { key: "thesis", label: "毕业论文", req: 6 },
    { key: "other", label: "其他实践", req: 10 }
  ],

  // 双学士项目自己的通识通修口径（不同项目要求不同）
  doubleCommon: {
    law: {
      core: 4, aesthetic: 2, ge: 4, seminar: 1, politics: 19,
      pe: 4, math: 4, info: 4, econlaw: 4, career: 2
    },
    finance: {
      core: 4, aesthetic: 2, ge: 4, seminar: 1, politics: 19,
      pe: 4, math: 16, info: 4, econlaw: 8, career: 2
    },
    accounting: {
      core: 4, aesthetic: 2, ge: 4, seminar: 1, politics: 19,
      pe: 4, math: 16, info: 4, econlaw: 8, career: 2
    }
  },

  // 主修方向对应的专业课程学分要求（2023-2025 届相同，届别差异以后再单独覆盖）
  majorProfessional: {
    "english-lit": [
      { key: "majorReq", label: "学科基础必修课", req: 50 },
      { key: "majorOpt", label: "学科基础选修课", req: 36 },
      { key: "dirReq", label: "专业方向必修课", req: 12 }
    ],
    "english-lin": [
      { key: "majorReq", label: "学科基础必修课", req: 50 },
      { key: "majorOpt", label: "学科基础选修课", req: 36 },
      { key: "dirReq", label: "专业方向必修课", req: 12 }
    ],
    "english-media": [
      { key: "majorReq", label: "学科基础必修课", req: 50 },
      { key: "majorOpt", label: "学科基础选修课", req: 36 },
      { key: "dirReq", label: "专业方向必修课", req: 12 }
    ],
    "translation": [
      { key: "majorReq", label: "学科基础必修课", req: 52 },
      { key: "majorOpt", label: "学科基础选修课", req: 32 },
      { key: "dirReq", label: "专业方向必修课", req: 14 }
    ],
    "business-english": [
      { key: "majorReq", label: "学科基础必修课", req: 52 },
      { key: "majorOpt", label: "学科基础选修课", req: 34 },
      { key: "dirReq", label: "专业方向必修课", req: 12 }
    ]
  },

  // 第二专业目录（占位：完整课程表后续逐届录入）
  minorCatalog: [],
  dualDegreeCatalog: []
};
