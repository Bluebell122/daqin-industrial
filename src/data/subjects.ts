import type {
  DemoCase,
  DemoId,
  Subject,
  SubjectDefinition,
} from "../types";

export const SUBJECTS: SubjectDefinition[] = [
  {
    id: "math",
    label: "数学",
    shortLabel: "数",
    description: "检查数量关系、方法选择和推理链条。",
    accent: "teal",
  },
  {
    id: "science",
    label: "科学",
    shortLabel: "科",
    description: "分辨观察、证据和因果解释。",
    accent: "amber",
  },
  {
    id: "language",
    label: "语文",
    shortLabel: "文",
    description: "检查观点、文本证据和表达的对应关系。",
    accent: "coral",
  },
];

export const SUBJECT_BY_ID: Record<Subject, SubjectDefinition> = SUBJECTS.reduce(
  (result, subject) => {
    result[subject.id] = subject;
    return result;
  },
  {} as Record<Subject, SubjectDefinition>,
);

export const DEMO_CASES: DemoCase[] = [
  {
    id: "math-ratio",
    subject: "math",
    title: "比例关系，还是相差关系？",
    question:
      "一杯果汁中，浓缩汁和水的比例是 1:3。现在要调制 8 杯同样浓度的果汁，需要多少杯浓缩汁？",
    draft:
      "原来是 1 杯浓缩汁和 3 杯水，一共 4 杯。要做 8 杯，就把 8 - 4 = 4，所以需要 1 + 4 = 5 杯浓缩汁。",
    rationale: "我觉得总量多了 4 杯，浓缩汁也应该多 4 杯。",
    stuckAt: "我在把原来的 4 杯变成 8 杯时不确定该怎么放大。",
  },
  {
    id: "science-correlation",
    subject: "science",
    title: "一起发生，就是因果吗？",
    question:
      "一项校园观察发现：夏天冰淇淋销量上升的同时，溺水事故也变多。能否据此说吃冰淇淋会导致溺水？请说明理由。",
    draft:
      "可以。两个数据都在夏天变多，说明吃冰淇淋的人更容易去游泳，所以冰淇淋导致了溺水。",
    rationale: "我把两个现象同时增加理解成了一个现象造成另一个现象。",
    stuckAt: "我不知道还需要什么证据，才能证明是因果关系。",
  },
  {
    id: "language-evidence",
    subject: "language",
    title: "观点需要哪一句话支撑？",
    question:
      "阅读文章片段：‘他把最后一盏灯留在门口，等晚归的人看见。’请结合文本说明主人公是一个怎样的人。",
    draft: "主人公非常善良，也很关心别人。",
    rationale: "留灯是一件帮助别人的事，所以我直接得出了这个性格结论。",
    stuckAt: "我知道结论，但不知道怎样把文章里的词句写进答案。",
  },
];

export const DEMO_CASE_BY_ID: Record<DemoId, DemoCase> = DEMO_CASES.reduce(
  (result, demo) => {
    result[demo.id] = demo;
    return result;
  },
  {} as Record<DemoId, DemoCase>,
);

export function getDemoCase(id: string | null | undefined): DemoCase | undefined {
  if (!id) return undefined;
  return DEMO_CASES.find((demo) => demo.id === id);
}

export function getDemoIdForSubmission(input: {
  demoId?: string;
  subject: Subject;
  question: string;
}): DemoId | undefined {
  if (input.demoId && Object.prototype.hasOwnProperty.call(DEMO_CASE_BY_ID, input.demoId)) {
    return input.demoId as DemoId;
  }

  const normalizedQuestion = input.question.trim();
  return DEMO_CASES.find(
    (demo) =>
      demo.subject === input.subject &&
      (normalizedQuestion === demo.question ||
        normalizedQuestion.includes(demo.question.slice(0, 18))),
  )?.id;
}
