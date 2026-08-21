import type {
  HeatmapCell,
  HeatmapCounts,
  MisconceptionCode,
  MisconceptionDefinition,
  Subject,
} from "../types";

export const MISCONCEPTION_DEFINITIONS: MisconceptionDefinition[] = [
  {
    code: "prompt_misread",
    label: "审题偏差",
    shortLabel: "审题偏差",
    description: "抓住了题目中的局部信息，却遗漏或改变了任务真正要求。",
    classroomIntervention: "让学生先用自己的话复述‘已知、未知、要证明什么’，再开始列式。",
    representativeThought: "题目问总路程，我只看到了速度，先把两个数字加起来。",
    probe: "如果只把题目最后一句圈出来，任务和你刚才理解的一样吗？",
  },
  {
    code: "concept_confusion",
    label: "概念混淆",
    shortLabel: "概念混淆",
    description: "知道相关术语，但把相邻概念的定义、条件或边界混在了一起。",
    classroomIntervention: "用‘相同点 / 不同点 / 什么时候不能用’三栏对照概念。",
    representativeThought: "平均数和中位数都是平均，所以它们应该总是一样。",
    probe: "什么条件改变时，这两个概念会给出不同结果？",
  },
  {
    code: "ratio_as_difference",
    label: "把比例当成差值",
    shortLabel: "比例 ≠ 相差",
    description: "把按倍数缩放的关系，当成每次增加固定数量的关系。",
    classroomIntervention: "让学生制作一张‘原来 / 放大后 / 每份数量’表，观察每一份是否保持不变。",
    representativeThought: "总量多了 4 杯，浓缩汁也多 4 杯。",
    probe: "如果总量变成原来的 2 倍，每一份会增加几杯，还是也变成 2 倍？",
  },
  {
    code: "method_mismatch",
    label: "方法错配",
    shortLabel: "方法错配",
    description: "使用了熟悉的公式或策略，但它的适用条件并不满足。",
    classroomIntervention: "要求学生在公式旁写出‘我为什么能用它’的条件。",
    representativeThought: "看到有两个数，就套用上次的加法公式。",
    probe: "这个方法解决的对象和本题对象，有哪些条件不同？",
  },
  {
    code: "transfer_failure",
    label: "迁移失败",
    shortLabel: "迁移失败",
    description: "会做原来的题型，却没有识别出新情境中相同的结构。",
    classroomIntervention: "把两道表面不同的题并排，让学生只圈出共同关系，不先计算。",
    representativeThought: "换成图表以后我就不知道了，虽然数字关系好像一样。",
    probe: "把故事删掉，只留下数量和关系，这两道题还像吗？",
  },
  {
    code: "causal_leap",
    label: "因果跳跃",
    shortLabel: "相关 ≠ 因果",
    description: "看到两个变量一起变化，就直接断定一个造成了另一个。",
    classroomIntervention: "引入第三变量和反事实提问，区分‘一起发生’与‘改变它会怎样’。",
    representativeThought: "冰淇淋和溺水都在夏天变多，所以冰淇淋导致了溺水。",
    probe: "还有什么因素会让这两个现象同时增加？如果不吃冰淇淋，结果会改变吗？",
  },
  {
    code: "missing_variable",
    label: "变量遗漏",
    shortLabel: "漏掉变量",
    description: "推理链条里有一个会影响结果的量没有被记录或控制。",
    classroomIntervention: "画因果图，逐条问‘还有哪个量可能同时影响两边’。",
    representativeThought: "只比较了学习时间，却没记录睡眠和练习难度。",
    probe: "如果只改变这个量，其他可能影响结果的因素能保持一样吗？",
  },
  {
    code: "unsupported_claim",
    label: "证据不足",
    shortLabel: "缺少证据",
    description: "结论可能合理，但没有指出可核对的文本、数据或观察证据。",
    classroomIntervention: "答案采用‘观点 + 原文词句 / 数据 + 这说明’三段式。",
    representativeThought: "他很善良，因为我觉得他就是这样的人。",
    probe: "哪一个具体词句能让别人看见你说的‘善良’？",
  },
  {
    code: "step_jump",
    label: "推理跳步",
    shortLabel: "推理跳步",
    description: "从一个事实直接跳到结论，中间缺少可检查的连接。",
    classroomIntervention: "让学生在每个箭头上补一个‘因为……所以……’句子。",
    representativeThought: "数字变大了，所以答案一定变大，没有解释为什么。",
    probe: "从这一步到下一步，中间需要哪条规则才能成立？",
  },
  {
    code: "calculation_error",
    label: "计算执行错误",
    shortLabel: "计算错误",
    description: "概念和方法基本正确，但在代入、运算或单位处理时出错。",
    classroomIntervention: "把估算、精确计算和单位检查拆成三个独立动作。",
    representativeThought: "步骤都对，但最后把 3 × 4 写成了 7。",
    probe: "不用精算，先估计结果大概应该落在哪个范围？",
  },
  {
    code: "expression_ambiguity",
    label: "表达歧义",
    shortLabel: "表达不清",
    description: "想法可能正确，但符号、句子或图示让读者无法确认你的意思。",
    classroomIntervention: "让同伴只按答案文字复述一次，再根据误解点修改表达。",
    representativeThought: "我写了‘先除以 2 再乘’，但没说两个动作分别对谁做。",
    probe: "别人只看这一步，能唯一复现你的操作顺序吗？",
  },
  {
    code: "no_verification",
    label: "缺少反思校验",
    shortLabel: "未做校验",
    description: "完成计算或结论后，没有用数量级、单位、反例或原题条件检查。",
    classroomIntervention: "把‘答案合理吗？’改成固定的单位、范围、代回三问。",
    representativeThought: "算出结果就交了，没有再看它是否符合题目的范围。",
    probe: "把这个答案放回原题，单位和大小都还合理吗？",
  },
];

export const MISCONCEPTION_BY_CODE: Record<
  Exclude<MisconceptionCode, "undetermined">,
  MisconceptionDefinition
> = MISCONCEPTION_DEFINITIONS.reduce(
  (result, definition) => {
    result[definition.code as Exclude<MisconceptionCode, "undetermined">] = definition;
    return result;
  },
  {} as Record<Exclude<MisconceptionCode, "undetermined">, MisconceptionDefinition>,
);

/** Stable, anonymous sample counts used on first load of the teacher view. */
export const DEFAULT_HEATMAP_COUNTS: HeatmapCounts = {
  math: {
    prompt_misread: 5,
    concept_confusion: 7,
    ratio_as_difference: 12,
    method_mismatch: 8,
    transfer_failure: 6,
    missing_variable: 4,
    step_jump: 6,
    calculation_error: 9,
    no_verification: 10,
  },
  science: {
    prompt_misread: 3,
    concept_confusion: 6,
    method_mismatch: 4,
    transfer_failure: 5,
    causal_leap: 14,
    missing_variable: 10,
    unsupported_claim: 4,
    step_jump: 5,
    no_verification: 7,
  },
  language: {
    prompt_misread: 6,
    concept_confusion: 5,
    transfer_failure: 4,
    unsupported_claim: 13,
    step_jump: 8,
    expression_ambiguity: 9,
    no_verification: 6,
  },
};

export const ALL_MISCONCEPTION_CODES: MisconceptionCode[] = [
  ...MISCONCEPTION_DEFINITIONS.map((definition) => definition.code),
  "undetermined",
];

export function cloneHeatmapCounts(source: HeatmapCounts = DEFAULT_HEATMAP_COUNTS): HeatmapCounts {
  return {
    math: { ...source.math },
    science: { ...source.science },
    language: { ...source.language },
  };
}

export function heatmapTotalForSubject(counts: HeatmapCounts, subject: Subject): number {
  return Object.values(counts[subject]).reduce((sum, count) => sum + (count ?? 0), 0);
}

export function getHeatmapCells(
  counts: HeatmapCounts,
  subjects: Subject[] = ["math", "science", "language"],
): HeatmapCell[] {
  return subjects.flatMap((subject) => {
    const total = heatmapTotalForSubject(counts, subject);
    return ALL_MISCONCEPTION_CODES.map((code) => ({
      subject,
      code,
      count: counts[subject][code] ?? 0,
      percentage: total > 0 ? Math.round(((counts[subject][code] ?? 0) / total) * 100) : 0,
    }));
  });
}
