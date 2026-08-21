import { getDemoIdForSubmission } from "../data/subjects";
import { MISCONCEPTION_BY_CODE } from "../data/heatmap";
import type {
  AnalysisResult,
  Analyzer,
  MisconceptionCode,
  MisconceptionDefinition,
  Submission,
  TraceNode,
  TraceStatus,
} from "../types";

export const TRACE_STAGES = [
  { id: "understand", label: "题目理解" },
  { id: "concept", label: "关键概念识别" },
  { id: "method", label: "公式 / 方法选择" },
  { id: "reasoning", label: "推理链条" },
  { id: "execution", label: "计算执行" },
  { id: "reflection", label: "反思校验" },
] as const;

type Fixture = Omit<AnalysisResult, "provider" | "createdAt">;

const DEMO_FIXTURES: Record<string, Fixture> = {
  "math-ratio": {
    trace: [
      {
        id: "understand",
        label: "题目理解",
        status: "clear",
        summary: "识别出原配方 1:3 和目标总量 8 杯。",
        evidence: "‘比例是 1:3’、‘调制 8 杯’",
        nextStep: "把总份数和每一份的数量写在同一张表里。",
      },
      {
        id: "concept",
        label: "关键概念识别",
        status: "blocked",
        summary: "把按倍数缩放的比例关系看成总量的固定差值。",
        evidence: "‘8 - 4 = 4’、‘浓缩汁也多 4 杯’",
        nextStep: "先问目标总量是原来的几倍，而不是多了几杯。",
      },
      {
        id: "method",
        label: "公式 / 方法选择",
        status: "attention",
        summary: "选择了相减再相加的方法，没有保持每一份的比例。",
        evidence: "‘1 + 4 = 5 杯浓缩汁’",
        nextStep: "用目标总量 ÷ 原总份数得到放大倍数。",
      },
      {
        id: "reasoning",
        label: "推理链条",
        status: "blocked",
        summary: "‘总量多 4’到‘浓缩汁多 4’之间缺少比例规则。",
        evidence: "‘总量多了 4 杯，浓缩汁也应该多 4 杯’",
        nextStep: "补上‘每一份都同时乘以同一个倍数’。",
      },
      {
        id: "execution",
        label: "计算执行",
        status: "clear",
        summary: "减法和加法本身计算正确，问题发生在方法之前。",
        evidence: "4、8、5 的运算结果",
        nextStep: "保留计算步骤，替换数量关系。",
      },
      {
        id: "reflection",
        label: "反思校验",
        status: "attention",
        summary: "没有把 5 杯浓缩汁和 3 杯水重新检查比例。",
        evidence: "答案没有回代到 1:3",
        nextStep: "检查 5 杯浓缩汁是否仍能与水保持 1:3。",
      },
    ],
    misconception: {
      code: "ratio_as_difference",
      label: "把比例当成差值",
      explanation: "你不是不会算，而是把‘每份一起放大’误解成了‘总量多多少，每部分就多多少’。",
      evidence: "‘总量多了 4 杯，浓缩汁也应该多 4 杯。’",
    },
    socraticProbe: "如果数字变成 2 倍，浓缩汁也一定只增加 2 杯吗？先画出每一份再判断。",
    prescription: {
      analogy: "把 1:3 想成一组固定的‘1 个红球 + 3 个白球’。复制整组时，每种球都按相同倍数复制。",
      practices: [
        "牛奶和咖啡的比例是 2:1，做 9 杯同样浓度的饮料，需要多少杯牛奶？",
        "地图比例尺是 1:100，图上距离扩大 3 倍，实际距离会怎样变化？",
      ],
      reflection: "我下次看到‘比例’时，先会找出哪些量必须一起乘同一个倍数？",
    },
    teacherIntervention: "用‘配方复制’实物卡片让学生先复制整组，再讨论为什么不能只增加差值。",
  },
  "science-correlation": {
    trace: [
      {
        id: "understand",
        label: "题目理解",
        status: "clear",
        summary: "注意到冰淇淋销量和溺水事故在同一季节上升。",
        evidence: "‘夏天……同时……变多’",
        nextStep: "把‘同时变化’和‘导致’分成两个待验证的判断。",
      },
      {
        id: "concept",
        label: "关键概念识别",
        status: "attention",
        summary: "没有区分相关关系与因果关系。",
        evidence: "‘说明吃冰淇淋的人更容易去游泳’",
        nextStep: "先列出可能同时影响两个现象的第三个变量。",
      },
      {
        id: "method",
        label: "公式 / 方法选择",
        status: "clear",
        summary: "选择了比较两个数据变化的方向，起点是有效的。",
        evidence: "比较了两个现象的季节变化",
        nextStep: "增加控制变量或实验设计，检验因果。",
      },
      {
        id: "reasoning",
        label: "推理链条",
        status: "blocked",
        summary: "从一起上升直接跳到了‘冰淇淋导致溺水’。",
        evidence: "‘所以冰淇淋导致了溺水’",
        nextStep: "尝试用‘如果不吃冰淇淋，其他条件不变会怎样’检验。",
      },
      {
        id: "execution",
        label: "计算执行",
        status: "clear",
        summary: "题目没有要求数值计算；当前问题不在计算执行。",
        evidence: "没有计算步骤",
        nextStep: "寻找可比较的证据或反事实。",
      },
      {
        id: "reflection",
        label: "反思校验",
        status: "blocked",
        summary: "没有检查季节、天气、游泳人数等替代解释。",
        evidence: "未提出第三变量或对照",
        nextStep: "列出至少一个替代解释，再决定结论强度。",
      },
    ],
    misconception: {
      code: "causal_leap",
      label: "因果跳跃",
      explanation: "你观察到了两个现象一起变化，但这只能说明它们相关，不能单独证明谁造成了谁。",
      evidence: "‘两个数据都在夏天变多，说明……冰淇淋导致了溺水。’",
    },
    socraticProbe: "夏天还有哪些因素会让冰淇淋销量和溺水事故一起增加？怎样设计对照才能排除它们？",
    prescription: {
      analogy: "雨伞销量和道路积水会同时增加，但不是雨伞制造了积水；下雨可能是共同原因。",
      practices: [
        "发现睡眠时间长的学生成绩更好，至少列出两个可能的第三变量。",
        "设计一个小实验，检验‘光照会让植物长得更高’而不是只观察两者同时变化。",
      ],
      reflection: "我下次看到两个数据一起变化时，会先问：还有什么共同原因？",
    },
    teacherIntervention: "让小组为同一组数据画三张解释图：A 导致 B、B 导致 A、C 同时影响两者。",
  },
  "language-evidence": {
    trace: [
      {
        id: "understand",
        label: "题目理解",
        status: "clear",
        summary: "明确了任务是结合文本说明人物性格，而不是只写评价词。",
        evidence: "‘怎样的人’、‘结合文本说明’",
        nextStep: "圈出能体现人物行为和动机的词句。",
      },
      {
        id: "concept",
        label: "关键概念识别",
        status: "clear",
        summary: "识别出‘留灯’是人物行为，也是性格判断的线索。",
        evidence: "‘把最后一盏灯留在门口’",
        nextStep: "把行为和‘关心别人’的解释连接起来。",
      },
      {
        id: "method",
        label: "公式 / 方法选择",
        status: "attention",
        summary: "选对了人物评价方向，但没有使用观点—证据—解释结构。",
        evidence: "答案只有‘主人公非常善良，也很关心别人’",
        nextStep: "补充原文词句，再说明它如何体现性格。",
      },
      {
        id: "reasoning",
        label: "推理链条",
        status: "blocked",
        summary: "从‘留灯’直接跳到性格结论，缺少文本证据和解释。",
        evidence: "没有引用‘最后一盏灯’或‘等晚归的人’",
        nextStep: "写出‘因为……所以……’的文本推理句。",
      },
      {
        id: "execution",
        label: "计算执行",
        status: "not_started",
        summary: "本题没有计算步骤；表达执行还需要补充证据。",
        evidence: "无计算内容",
        nextStep: "把关键词放进完整句子。",
      },
      {
        id: "reflection",
        label: "反思校验",
        status: "blocked",
        summary: "没有回看答案是否满足‘结合文本’这一要求。",
        evidence: "答案中没有原文词句",
        nextStep: "交卷前检查：观点、证据、解释是否都出现。",
      },
    ],
    misconception: {
      code: "unsupported_claim",
      label: "证据不足",
      explanation: "你已经形成了一个合理观点，但答案还没有让读者看到支撑它的具体文本证据。",
      evidence: "‘主人公非常善良，也很关心别人。’",
    },
    socraticProbe: "哪一句具体文字能让读者看见你说的‘善良’？引用后再解释它体现了什么。",
    prescription: {
      analogy: "观点像法庭上的结论，文本中的词句就是证人；只有把证人请出来，结论才站得住。",
      practices: [
        "从‘他把伞递给陌生人’中写出一个人物品质，并引用动作作为证据。",
        "给‘小河安静地流着’写一个环境特点，引用词语并解释作用。",
      ],
      reflection: "我下次写人物特点时，会先找哪一个动作或语言可以证明它？",
    },
    teacherIntervention: "让同伴用荧光笔分别标出答案里的观点、原文证据和解释，缺哪一块一眼可见。",
  },
};

const GENERIC_DEFINITIONS: Record<MisconceptionCode, MisconceptionDefinition | undefined> = {
  prompt_misread: MISCONCEPTION_BY_CODE.prompt_misread,
  concept_confusion: MISCONCEPTION_BY_CODE.concept_confusion,
  ratio_as_difference: MISCONCEPTION_BY_CODE.ratio_as_difference,
  method_mismatch: MISCONCEPTION_BY_CODE.method_mismatch,
  transfer_failure: MISCONCEPTION_BY_CODE.transfer_failure,
  causal_leap: MISCONCEPTION_BY_CODE.causal_leap,
  missing_variable: MISCONCEPTION_BY_CODE.missing_variable,
  unsupported_claim: MISCONCEPTION_BY_CODE.unsupported_claim,
  step_jump: MISCONCEPTION_BY_CODE.step_jump,
  calculation_error: MISCONCEPTION_BY_CODE.calculation_error,
  expression_ambiguity: MISCONCEPTION_BY_CODE.expression_ambiguity,
  no_verification: MISCONCEPTION_BY_CODE.no_verification,
  undetermined: undefined,
};

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function inferCode(submission: Submission): MisconceptionCode {
  const text = `${submission.question}\n${submission.draft}\n${submission.rationale}\n${submission.stuckAt}`.toLowerCase();

  if (submission.subject === "math" && includesAny(text, ["比例", "倍", "配方", "每份", "多了", "差"])
    && includesAny(text, ["应该多", "加上", "减去", "差值", "总量多"])) {
    return "ratio_as_difference";
  }
  if (submission.subject === "science" && includesAny(text, ["导致", "造成", "因为", "相关", "同时", "说明"])) {
    return "causal_leap";
  }
  if (submission.subject === "language" && includesAny(text, ["文章", "原文", "文本", "词句", "观点", "结论"]) &&
    !includesAny(text, ["引用", "证据", "因为……所以", "因为...所以"])) {
    return "unsupported_claim";
  }
  if (includesAny(text, ["看不懂题", "没看清", "问的是", "题目要求"])) return "prompt_misread";
  if (includesAny(text, ["公式", "套用", "直接用", "方法"])) return "method_mismatch";
  if (includesAny(text, ["所以", "因此", "一定", "肯定"]) && submission.draft.length < 90) return "step_jump";
  if (includesAny(text, ["忘了", "没考虑", "还需要", "变量", "条件"])) return "missing_variable";
  if (includesAny(text, ["算错", "计算", "小数", "单位"])) return "calculation_error";
  if (includesAny(text, ["表达", "不清楚", "看不懂我写的"])) return "expression_ambiguity";
  if (
    submission.draft.length >= 40 &&
    includesAny(text, ["答案", "结果", "算出", "结论"]) &&
    includesAny(text, ["检查", "验证", "回代", "合理"]) === false
  ) return "no_verification";
  return "undetermined";
}

function genericTrace(code: MisconceptionCode, submission: Submission): TraceNode[] {
  const blockedStage = code === "causal_leap" ? "reasoning" : code === "unsupported_claim" ? "reasoning" : "concept";
  return TRACE_STAGES.map((stage, index) => {
    let status: TraceStatus = "clear";
    if (stage.id === blockedStage) status = "blocked";
    else if (index === 2 || index === 5) status = "attention";
    if (code === "undetermined" && index > 1) status = "not_started";
    return {
      id: stage.id,
      label: stage.label,
      status,
      summary:
        stage.id === blockedStage
          ? `这里需要进一步检查${MISCONCEPTION_BY_CODE[code as keyof typeof MISCONCEPTION_BY_CODE]?.shortLabel ?? "思考"}。`
          : "当前输入没有显示明显偏离。",
      evidence: index === 0 ? submission.question.slice(0, 80) : undefined,
      nextStep: stage.id === blockedStage ? "把这一阶段拆成可核对的小问题。" : undefined,
    };
  });
}

function genericResult(submission: Submission, code: MisconceptionCode): Fixture {
  const definition = GENERIC_DEFINITIONS[code];
  if (!definition) {
    return {
      trace: genericTrace(code, submission),
      misconception: {
        code: "undetermined",
        label: "证据不足，暂未确定",
        explanation: "目前的思考记录还不足以确定一个具体卡点。可以补充你当时依据的条件或下一步打算。",
        evidence: submission.stuckAt || submission.draft.slice(0, 100),
      },
      socraticProbe: "你最确定的一步是什么？当时依据了题目中的哪一条信息？",
      prescription: {
        analogy: "把思考当成一条可回放的路线，先标出你确定经过的路口。",
        practices: ["用一句话写出题目已知和未知。", "为下一步写出一个可以验证的理由。"],
        reflection: "我还需要记录哪一条证据，才能让别人复现我的思考？",
      },
      teacherIntervention: "请学生补写一个‘因为……所以……’句子，再进行第二次诊断。",
    };
  }

  return {
    trace: genericTrace(code, submission),
    misconception: {
      code,
      label: definition.label,
      explanation: definition.description,
      evidence: submission.rationale || submission.draft.slice(0, 100),
    },
    socraticProbe: definition.probe,
    prescription: {
      analogy: `把这个卡点想成一次路线检查：${definition.description}`,
      practices: ["把当前步骤拆成两个可检查的小步骤。", "找一道结构相似但情境不同的题，先说关系再动笔。"],
      reflection: "我下次遇到类似题目时，先检查哪一个条件？",
    },
    teacherIntervention: definition.classroomIntervention,
  };
}

export class LocalAnalyzer implements Analyzer {
  async analyze(submission: Submission): Promise<AnalysisResult> {
    const demoId = getDemoIdForSubmission({
      demoId: submission.demoId,
      subject: submission.subject,
      question: submission.question,
    });
    const fixture = demoId
      ? DEMO_FIXTURES[demoId] ?? genericResult(submission, inferCode(submission))
      : genericResult(submission, inferCode(submission));
    return {
      ...fixture,
      provider: "local",
      confidence: demoId ? "high" : fixture.misconception.code === "undetermined" ? "low" : "medium",
    };
  }
}

export const localAnalyzer = new LocalAnalyzer();

export function createLocalAnalyzer(): LocalAnalyzer {
  return new LocalAnalyzer();
}
