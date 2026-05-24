// ── Grammar patterns with questions ───────────────────────────────────────
// Each pattern has an id, name, level, description, and questions.
// Question types: "pick" (4 options, pick correct) | "fill" (sentence with ___, pick correct fill)

export const grammarPatterns = [

  // ── HSK 1 patterns ────────────────────────────────────────────────────
  {
    id: "shi_copula",
    name: "是 (to be)",
    level: 1,
    description: "Subject + 是 + noun",
    questions: [
      {
        type: "pick",
        prompt: "She is a teacher.",
        correct: "她是老师。",
        distractors: ["她很老师。", "她有老师。", "她做老师。"],
        explanation: "是 links subject to a noun. 很 is for adjectives, not nouns."
      },
      {
        type: "pick",
        prompt: "I am a student.",
        correct: "我是学生。",
        distractors: ["我很学生。", "我在学生。", "我有学生。"],
        explanation: "是 + noun. Never use 很 before a noun."
      },
      {
        type: "fill",
        prompt: "他___医生。(He is a doctor.)",
        correct: "是",
        distractors: ["很", "有", "在"],
        explanation: "是 connects subject to a noun identity."
      },
    ]
  },

  {
    id: "you_have",
    name: "有 (to have / there is)",
    level: 1,
    description: "Subject + 有 + object",
    questions: [
      {
        type: "pick",
        prompt: "I have a cat.",
        correct: "我有一只猫。",
        distractors: ["我是一只猫。", "我在一只猫。", "我很一只猫。"],
        explanation: "有 expresses possession."
      },
      {
        type: "fill",
        prompt: "桌子上___一本书。(There is a book on the table.)",
        correct: "有",
        distractors: ["是", "在", "很"],
        explanation: "有 expresses existence — 'there is/are'."
      },
    ]
  },

  {
    id: "zai_location",
    name: "在 (location)",
    level: 1,
    description: "Subject + 在 + place",
    questions: [
      {
        type: "pick",
        prompt: "My book is on the table.",
        correct: "我的书在桌子上。",
        distractors: ["我的书是桌子上。", "我的书有桌子上。", "我的书很桌子上。"],
        explanation: "在 + location expresses where something is."
      },
      {
        type: "fill",
        prompt: "他___家。(He is at home.)",
        correct: "在",
        distractors: ["是", "有", "去"],
        explanation: "在 = at/in a location."
      },
    ]
  },

  {
    id: "hen_adj",
    name: "很 + adjective",
    level: 1,
    description: "Subject + 很 + adjective",
    questions: [
      {
        type: "pick",
        prompt: "The weather today is very hot.",
        correct: "今天的天气很热。",
        distractors: ["今天的天气是热。", "今天的天气有热。", "今天的天气热。"],
        explanation: "Adjective predicates need 很 (or another adverb). Bare adjectives sound comparative."
      },
      {
        type: "fill",
        prompt: "他___高兴。(He is very happy.)",
        correct: "很",
        distractors: ["是", "有", "在"],
        explanation: "很 is the default adverb before adjectives in Mandarin."
      },
    ]
  },

  {
    id: "neg_bu",
    name: "不 negation",
    level: 1,
    description: "Subject + 不 + verb/adjective",
    questions: [
      {
        type: "pick",
        prompt: "I don't like coffee.",
        correct: "我不喜欢咖啡。",
        distractors: ["我没喜欢咖啡。", "我不是喜欢咖啡。", "我无喜欢咖啡。"],
        explanation: "不 negates present/habitual actions and adjectives."
      },
      {
        type: "fill",
        prompt: "她___是中国人。(She is not Chinese.)",
        correct: "不",
        distractors: ["没", "别", "无"],
        explanation: "不是 negates identity statements with 是."
      },
    ]
  },

  {
    id: "neg_meiyou",
    name: "没有 negation (past/possession)",
    level: 1,
    description: "没有 for past actions and possession",
    questions: [
      {
        type: "pick",
        prompt: "I didn't eat breakfast.",
        correct: "我没有吃早饭。",
        distractors: ["我不吃早饭。", "我不是吃早饭。", "我没是吃早饭。"],
        explanation: "没有 negates completed actions (past). 不 negates habits/future."
      },
      {
        type: "fill",
        prompt: "他___钱。(He doesn't have money.)",
        correct: "没有",
        distractors: ["不是", "不有", "没是"],
        explanation: "没有 negates possession."
      },
    ]
  },

  {
    id: "ma_question",
    name: "吗 yes/no question",
    level: 1,
    description: "Statement + 吗？",
    questions: [
      {
        type: "pick",
        prompt: "Are you a student?",
        correct: "你是学生吗？",
        distractors: ["你是不是学生？", "你是学生？", "你学生吗？"],
        explanation: "Add 吗 to the end of a statement to form a yes/no question."
      },
      {
        type: "fill",
        prompt: "你喜欢中国菜___？(Do you like Chinese food?)",
        correct: "吗",
        distractors: ["呢", "吧", "啊"],
        explanation: "吗 turns a statement into a yes/no question."
      },
    ]
  },

  {
    id: "want_xiang_yao",
    name: "想 / 要 (want to)",
    level: 1,
    description: "Subject + 想/要 + verb",
    questions: [
      {
        type: "pick",
        prompt: "I want to drink water.",
        correct: "我想喝水。",
        distractors: ["我喝想水。", "我是想喝水。", "我很想喝水是。"],
        explanation: "想 + verb = want to do something. Verb follows directly."
      },
      {
        type: "fill",
        prompt: "她___去北京。(She wants to go to Beijing.)",
        correct: "想",
        distractors: ["是", "在", "有"],
        explanation: "想 expresses desire before a verb."
      },
    ]
  },

  // ── HSK 2 patterns (the ones you struggle with) ────────────────────────
  {
    id: "verb_de_complement",
    name: "Verb + 得 + complement",
    level: 2,
    description: "Verb + 得 + result/degree complement",
    questions: [
      {
        type: "pick",
        prompt: "She speaks Chinese very well.",
        correct: "她说汉语说得很好。",
        distractors: ["她说汉语很好。", "她很好说汉语。", "她说得汉语很好。"],
        explanation: "Verb + 得 + complement. When there's an object, repeat the verb: 说汉语说得很好."
      },
      {
        type: "pick",
        prompt: "He runs very fast.",
        correct: "他跑得很快。",
        distractors: ["他很快跑。", "他跑很快。", "他是跑得很快。"],
        explanation: "Verb + 得 + complement. No object here, so verb appears only once."
      },
      {
        type: "fill",
        prompt: "她唱歌唱___很好听。(She sings very beautifully.)",
        correct: "得",
        distractors: ["的", "地", "了"],
        explanation: "得 links the verb to its degree complement."
      },
      {
        type: "pick",
        prompt: "He writes characters very neatly.",
        correct: "他写字写得很整齐。",
        distractors: ["他写字很整齐。", "他写得字很整齐。", "他很整齐写字。"],
        explanation: "With an object (字), repeat the verb before 得: 写字写得."
      },
    ]
  },

  {
    id: "bi_comparison",
    name: "比 comparison",
    level: 2,
    description: "A + 比 + B + adjective",
    questions: [
      {
        type: "pick",
        prompt: "He is taller than me.",
        correct: "他比我高。",
        distractors: ["他比我更高。", "他很比我高。", "他高比我。"],
        explanation: "A + 比 + B + adjective. Do NOT add 很 or 更 after 比 in basic comparisons."
      },
      {
        type: "pick",
        prompt: "This book is more interesting than that one.",
        correct: "这本书比那本书有意思。",
        distractors: ["这本书很比那本书有意思。", "这本书比那本书更有意思。", "这本书有意思比那本书。"],
        explanation: "比 + B + adjective. Don't insert 很/更 directly after 比."
      },
      {
        type: "fill",
        prompt: "今天___昨天冷。(Today is colder than yesterday.)",
        correct: "比",
        distractors: ["和", "跟", "比较"],
        explanation: "比 is the comparison preposition: A 比 B + adjective."
      },
      {
        type: "pick",
        prompt: "My sister is three years older than me.",
        correct: "我姐姐比我大三岁。",
        distractors: ["我姐姐比我三岁大。", "我姐姐大比我三岁。", "我姐姐三岁比我大。"],
        explanation: "比 + B + adjective + specific amount. Amount comes after the adjective."
      },
    ]
  },

  {
    id: "xian_ranhou",
    name: "先…然后 sequence",
    level: 2,
    description: "First do X, then do Y",
    questions: [
      {
        type: "pick",
        prompt: "First wash your hands, then eat.",
        correct: "先洗手，然后吃饭。",
        distractors: ["然后洗手，先吃饭。", "先洗手，后来吃饭。", "先是洗手，然后是吃饭。"],
        explanation: "先 + action1，然后 + action2. 后来 refers to something that happened later in a story, not instructions."
      },
      {
        type: "fill",
        prompt: "我们___吃饭，___去看电影。(We'll eat first, then go to the movies.)",
        correct: "先…然后",
        distractors: ["然后…先", "因为…所以", "虽然…但是"],
        explanation: "先…然后 = first…then, for sequential actions."
      },
      {
        type: "pick",
        prompt: "Please first read the question, then answer.",
        correct: "请先看题目，然后回答。",
        distractors: ["请然后看题目，先回答。", "请先看题目，后来回答。", "请先看题目，所以回答。"],
        explanation: "先 comes before the first action verb; 然后 introduces the next step."
      },
    ]
  },

  {
    id: "yinwei_suoyi",
    name: "因为…所以 cause-effect",
    level: 2,
    description: "Because X, therefore Y",
    questions: [
      {
        type: "pick",
        prompt: "Because it's raining, so I won't go out.",
        correct: "因为下雨，所以我不出去。",
        distractors: ["因为下雨，但是我不出去。", "虽然下雨，所以我不出去。", "下雨，因为我不出去。"],
        explanation: "因为 + cause，所以 + result. Don't mix with 但是 (contrast) or 虽然 (concession)."
      },
      {
        type: "fill",
        prompt: "___他生病了，___他没来上课。(Because he was sick, he didn't come to class.)",
        correct: "因为…所以",
        distractors: ["虽然…但是", "先…然后", "如果…就"],
        explanation: "因为…所以 expresses cause and effect."
      },
      {
        type: "pick",
        prompt: "Because I like Chinese, I study every day.",
        correct: "因为我喜欢汉语，所以我每天学习。",
        distractors: ["我喜欢汉语，因为我每天学习。", "虽然我喜欢汉语，所以我每天学习。", "因为我喜欢汉语，但是我每天学习。"],
        explanation: "因为 must come before the cause clause. 所以 introduces the result."
      },
    ]
  },

  {
    id: "suiran_danshi",
    name: "虽然…但是 concession",
    level: 2,
    description: "Although X, but Y",
    questions: [
      {
        type: "pick",
        prompt: "Although he is busy, he still comes to help.",
        correct: "虽然他很忙，但是他还是来帮忙。",
        distractors: ["因为他很忙，但是他还是来帮忙。", "虽然他很忙，所以他还是来帮忙。", "他很忙，虽然他还是来帮忙。"],
        explanation: "虽然 (although) + clause，但是 (but) + contrasting result. Never pair 虽然 with 所以."
      },
      {
        type: "fill",
        prompt: "___这道菜不好看，___很好吃。(Although this dish doesn't look good, it tastes great.)",
        correct: "虽然…但是",
        distractors: ["因为…所以", "先…然后", "不但…而且"],
        explanation: "虽然…但是 acknowledges one fact but introduces a contrast."
      },
      {
        type: "pick",
        prompt: "Although the test was hard, she passed.",
        correct: "虽然考试很难，但是她通过了。",
        distractors: ["虽然考试很难，所以她通过了。", "因为考试很难，但是她通过了。", "考试很难，虽然她通过了。"],
        explanation: "虽然 must open the concession clause. 但是 introduces the surprising result."
      },
    ]
  },

  {
    id: "kuai_le_imminent",
    name: "快…了 / 要…了 imminent",
    level: 2,
    description: "Something is about to happen",
    questions: [
      {
        type: "pick",
        prompt: "The train is about to arrive.",
        correct: "火车快到了。",
        distractors: ["火车快到。", "火车要到。", "火车将到了。"],
        explanation: "快…了 or 要…了 = something is about to happen. 了 is required at the end."
      },
      {
        type: "pick",
        prompt: "It's about to rain.",
        correct: "要下雨了。",
        distractors: ["要下雨。", "快下雨。", "将下雨了。"],
        explanation: "要…了 marks imminent action. 了 signals the change is coming."
      },
      {
        type: "fill",
        prompt: "他___来___。(He is about to come.)",
        correct: "要…了",
        distractors: ["很…了", "已经…了", "不…了"],
        explanation: "要…了 = about to. Both 要 and 了 are needed."
      },
      {
        type: "pick",
        prompt: "Class is about to start.",
        correct: "课快开始了。",
        distractors: ["课快开始。", "课要开始。", "课开始了快。"],
        explanation: "快 comes before the verb, and 了 comes at the end of the sentence."
      },
    ]
  },

  {
    id: "shi_de_emphasis",
    name: "是…的 emphasis",
    level: 2,
    description: "Emphasise time, place, or manner of a past action",
    questions: [
      {
        type: "pick",
        prompt: "I came here by plane. (emphasising method)",
        correct: "我是坐飞机来的。",
        distractors: ["我坐飞机来了。", "我是坐飞机来了。", "我坐飞机是来的。"],
        explanation: "是…的 emphasises how/when/where a past action happened. 是 before the focus, 的 at the end."
      },
      {
        type: "pick",
        prompt: "She came here last year. (emphasising time)",
        correct: "她是去年来的。",
        distractors: ["她去年来了。", "她是去年来了。", "她去年是来的。"],
        explanation: "是 + time/manner/place + verb + 的. The 是 can be omitted in speech but 的 is required."
      },
      {
        type: "fill",
        prompt: "我___在北京出生___。(I was born in Beijing — emphasising place.)",
        correct: "是…的",
        distractors: ["很…了", "要…了", "先…然后"],
        explanation: "是…的 highlights the circumstance (place, time, method) of a completed action."
      },
      {
        type: "pick",
        prompt: "He learned Chinese in Shanghai.",
        correct: "他是在上海学的汉语。",
        distractors: ["他在上海学了汉语。", "他是在上海学了汉语。", "他在上海是学的汉语。"],
        explanation: "是 + 在 + place + verb + 的 + object. Object can come after 的."
      },
    ]
  },

  {
    id: "guo_experience",
    name: "过 (past experience)",
    level: 2,
    description: "Verb + 过 = have ever done",
    questions: [
      {
        type: "pick",
        prompt: "I have been to Beijing before.",
        correct: "我去过北京。",
        distractors: ["我去了北京。", "我去北京了。", "我有去北京。"],
        explanation: "Verb + 过 = have experienced. 了 marks completion; 过 marks life experience."
      },
      {
        type: "fill",
        prompt: "你吃___北京烤鸭吗？(Have you ever eaten Peking duck?)",
        correct: "过",
        distractors: ["了", "着", "得"],
        explanation: "过 after a verb asks about life experience."
      },
      {
        type: "pick",
        prompt: "I have never eaten durian.",
        correct: "我没吃过榴莲。",
        distractors: ["我不吃过榴莲。", "我没有吃了榴莲。", "我从来不吃榴莲。"],
        explanation: "没 + verb + 过 = have never done. Never use 不 to negate 过."
      },
    ]
  },

  {
    id: "zhe_ongoing",
    name: "着 (ongoing state)",
    level: 2,
    description: "Verb + 着 = action in progress as background",
    questions: [
      {
        type: "pick",
        prompt: "She is wearing a red dress.",
        correct: "她穿着一件红色的衣服。",
        distractors: ["她穿了一件红色的衣服。", "她在穿一件红色的衣服。", "她穿一件红色的衣服。"],
        explanation: "Verb + 着 describes an ongoing state or background condition."
      },
      {
        type: "fill",
        prompt: "门开___。(The door is open — ongoing state.)",
        correct: "着",
        distractors: ["了", "过", "得"],
        explanation: "着 after a verb shows the result is still in effect (the door remains open)."
      },
    ]
  },

  {
    id: "ruguo_jiu",
    name: "如果…就 conditionals",
    level: 2,
    description: "If X, then Y",
    questions: [
      {
        type: "pick",
        prompt: "If it rains tomorrow, I won't go out.",
        correct: "如果明天下雨，我就不出去。",
        distractors: ["因为明天下雨，我就不出去。", "如果明天下雨，所以我不出去。", "明天下雨，如果我就不出去。"],
        explanation: "如果 + condition，就 + result. Don't use 所以 — that's for cause-effect, not conditions."
      },
      {
        type: "fill",
        prompt: "___你有时间，___来我家吧。(If you have time, come to my place.)",
        correct: "如果…就",
        distractors: ["因为…所以", "虽然…但是", "先…然后"],
        explanation: "如果…就 = if…then. A conditional, not a cause-effect."
      },
    ]
  },
];

// ── Helper: get all pattern IDs ────────────────────────────────────────────
export const patternIds = grammarPatterns.map(p => p.id);

// ── Helper: build a weighted question pool based on performance data ───────
// performanceMap: { patternId: { correct, incorrect } }
export const buildWeightedPool = (performanceMap) => {
  const pool = [];
  for (const pattern of grammarPatterns) {
    const perf = performanceMap[pattern.id] || { correct: 0, incorrect: 0 };
    const total = perf.correct + perf.incorrect;
    // Base weight 2; unseen patterns get 3; wrong-heavy patterns get more
    let weight = 2;
    if (total === 0) weight = 3; // unseen — prioritise
    else {
      const errorRate = perf.incorrect / total;
      if (errorRate >= 0.6) weight = 5;
      else if (errorRate >= 0.4) weight = 4;
      else if (errorRate >= 0.2) weight = 3;
      else weight = 1; // well-known — deprioritise
    }
    // HSK 2 patterns get +1 base weight to always appear more often
    if (pattern.level === 2) weight += 1;
    for (let i = 0; i < weight; i++) pool.push(pattern);
  }
  return pool;
};

// ── Helper: pick a random question from a pattern ─────────────────────────
export const pickQuestion = (pattern) => {
  const q = pattern.questions[Math.floor(Math.random() * pattern.questions.length)];
  // Build shuffled choices
  const choices = [...q.distractors, q.correct].sort(() => Math.random() - 0.5);
  return { ...q, choices, patternId: pattern.id, patternName: pattern.name, patternLevel: pattern.level };
};
