import type { AnswerMap, PromptDraft, TaskConfig } from '../types';

const categoryToDraftKey = {
  background: 'background',
  requirement: 'requirements',
  format: 'outputFormat',
  constraint: 'constraints',
  quality: 'qualityStandards',
} as const;

function appendUnique(list: string[], value: string) {
  if (!value || list.includes(value)) {
    return;
  }

  list.push(value);
}

export function buildPromptDraft(config: TaskConfig, originalRequest: string, answers: AnswerMap): PromptDraft {
  const draft: PromptDraft = {
    role: config.defaultRole,
    taskGoal: originalRequest,
    background: [],
    inputMaterials: ['如果我在后续消息中提供材料，请优先基于材料完成任务。'],
    requirements: [...config.defaultRequirements],
    outputFormat: config.defaultOutputFormat,
    qualityStandards: [...config.defaultQualityStandards],
    constraints: [...config.defaultConstraints],
    insufficientInfoPolicy: [
      '如果信息不足，请先说明你的合理假设。',
      '优先基于合理假设完成任务，不要因为小问题反复追问。',
      '遇到关键缺失信息且无法合理假设时，再提出 1-3 个必要问题。',
    ],
  };

  for (const question of config.questions) {
    const answer = answers[question.id];
    if (!answer) {
      continue;
    }

    const target = categoryToDraftKey[question.category];
    const sentence = `${question.fieldLabel}：${answer.value}`;

    if (target === 'outputFormat') {
      draft.outputFormat = `${draft.outputFormat}\n- ${sentence}`;
    } else {
      appendUnique(draft[target], sentence);
    }
  }

  return draft;
}

function renderList(items: string[], fallback: string) {
  const source = items.length > 0 ? items : [fallback];
  return source.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function renderBullets(items: string[], fallback: string) {
  const source = items.length > 0 ? items : [fallback];
  return source.map((item) => `- ${item}`).join('\n');
}

export function renderFinalPrompt(draft: PromptDraft): string {
  return `你是一名${draft.role}。

我的任务是：
${draft.taskGoal}

背景信息：
${renderBullets(draft.background, '请根据任务本身判断必要背景，并在回答开头说明你的理解。')}

输入材料：
${renderBullets(draft.inputMaterials, '暂无额外材料。')}

你需要完成：
${renderList(draft.requirements, '围绕任务目标给出完整、可直接使用的结果。')}

请遵守以下限制：
${renderBullets(draft.constraints, '不要编造事实；必要时说明假设。')}

输出格式：
${draft.outputFormat}

质量标准：
${renderBullets(draft.qualityStandards, '内容应准确、完整、结构清晰。')}

如果信息不足：
${renderBullets(draft.insufficientInfoPolicy, '请基于合理假设继续完成任务。')}

最终结果应可以直接复制使用。`;
}

export function generatePrompt(config: TaskConfig, originalRequest: string, answers: AnswerMap): string {
  const draft = buildPromptDraft(config, originalRequest, answers);
  return renderFinalPrompt(draft);
}
