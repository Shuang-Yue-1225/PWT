import { taskConfigMap, taskConfigs } from '../data/taskConfigs';
import type { AgentSettings, AgentTaskPlan, AnswerMap, PromptQuestion, TaskConfig, TaskType } from '../types';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

const validTaskTypes = new Set<TaskType>(taskConfigs.map((config) => config.id));
const validCategories = new Set<PromptQuestion['category']>([
  'background',
  'requirement',
  'format',
  'constraint',
  'quality',
]);

interface OpenAIResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
}

async function callOpenAI(settings: AgentSettings, input: string, expectJson: boolean) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model.trim() || 'gpt-5.2',
      input,
      text: expectJson
        ? {
            format: {
              type: 'json_object',
            },
          }
        : undefined,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as OpenAIResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI API 请求失败：${response.status}`);
  }

  const outputText =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? '')
      .join('\n')
      .trim();

  if (!outputText) {
    throw new Error('OpenAI API 没有返回可用文本。');
  }

  return outputText;
}

function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const source = jsonMatch ? jsonMatch[0] : trimmed;
  return JSON.parse(source) as T;
}

function sanitizeTaskType(value: unknown): TaskType {
  return typeof value === 'string' && validTaskTypes.has(value as TaskType) ? (value as TaskType) : 'general';
}

function sanitizeCategory(value: unknown): PromptQuestion['category'] {
  return typeof value === 'string' && validCategories.has(value as PromptQuestion['category'])
    ? (value as PromptQuestion['category'])
    : 'requirement';
}

function sanitizeQuestion(question: Partial<PromptQuestion>, index: number): PromptQuestion {
  const options = Array.isArray(question.options) ? question.options.slice(0, 5) : [];

  return {
    id: question.id?.replace(/[^a-zA-Z0-9_-]/g, '_') || `agent_question_${index + 1}`,
    title: question.title || `请确认第 ${index + 1} 个细节`,
    helper: question.helper || '选择最接近的一项，也可以交给 AI 自主决定。',
    fieldLabel: question.fieldLabel || `补充信息 ${index + 1}`,
    category: sanitizeCategory(question.category),
    required: Boolean(question.required),
    autonomousValue: question.autonomousValue || '由 AI 根据任务目标自主决定。',
    options: options.map((option, optionIndex) => ({
      id: option.id || `option_${optionIndex + 1}`,
      label: option.label || `选项 ${optionIndex + 1}`,
      value: option.value || option.label || `选项 ${optionIndex + 1}`,
    })),
  };
}

function buildAgentConfig(plan: AgentTaskPlan): TaskConfig {
  const baseConfig = taskConfigMap[plan.taskType] || taskConfigMap.general;

  return {
    ...baseConfig,
    id: plan.taskType,
    name: plan.taskName || `${baseConfig.name} · Agent 增强`,
    description: plan.taskDescription || baseConfig.description,
    questions: plan.questions.length > 0 ? plan.questions : baseConfig.questions,
  };
}

export function isAgentReady(settings: AgentSettings) {
  return settings.enabled && Boolean(settings.apiKey.trim());
}

export async function createAgentTaskConfig(settings: AgentSettings, originalRequest: string): Promise<{
  analysisTaskType: TaskType;
  confidence: number;
  config: TaskConfig;
}> {
  const prompt = `你是一个 Prompt 生成工具中的任务规划 agent。

用户只输入了一个简单请求，你需要：
1. 判断任务类型，只能从这些 id 中选择：${taskConfigs.map((config) => config.id).join(', ')}
2. 设计 3 到 5 个适合新手回答的追问问题，每个问题最多 5 个选项
3. 每个问题都必须给出 autonomousValue，表示“由 AI 自主决定”时应采用的合理默认值
4. 问题要优先采用选择题，不要问太多开放题
5. 只返回 JSON，不要 Markdown，不要解释

JSON 格式：
{
  "taskType": "writing",
  "confidence": 0.88,
  "taskName": "写作类",
  "taskDescription": "一句话说明识别理由",
  "questions": [
    {
      "id": "audience",
      "title": "主要读者是谁？",
      "helper": "这会影响解释深度和语气。",
      "fieldLabel": "目标读者",
      "category": "background",
      "required": true,
      "autonomousValue": "面向普通读者，必要概念要简要解释。",
      "options": [
        {"id": "general", "label": "普通读者", "value": "普通读者"}
      ]
    }
  ]
}

category 只能是 background、requirement、format、constraint、quality。

用户请求：
${originalRequest}`;

  const raw = await callOpenAI(settings, prompt, true);
  const parsed = parseJsonObject<Partial<AgentTaskPlan>>(raw);
  const taskType = sanitizeTaskType(parsed.taskType);
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions.slice(0, 5).map((question, index) => sanitizeQuestion(question, index))
    : [];
  const plan: AgentTaskPlan = {
    taskType,
    confidence:
      typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
        ? Math.max(0.1, Math.min(0.99, parsed.confidence))
        : 0.82,
    taskName: parsed.taskName || `${taskConfigMap[taskType].name} · Agent 增强`,
    taskDescription: parsed.taskDescription || '由 agent 根据用户请求动态识别任务类型并设计追问问题。',
    questions,
  };

  return {
    analysisTaskType: taskType,
    confidence: plan.confidence,
    config: buildAgentConfig(plan),
  };
}

export async function createAgentFollowUpQuestions(
  settings: AgentSettings,
  originalRequest: string,
  config: TaskConfig,
  answers: AnswerMap,
): Promise<PromptQuestion[]> {
  const answeredSummary = config.questions
    .filter((question) => answers[question.id])
    .map((question) => `${question.fieldLabel}：${answers[question.id].value}`)
    .join('\n');

  const prompt = `你是 Prompt 生成工具中的追问 agent。

请根据用户原始请求和已确认信息，判断是否还需要继续细化。
如果还需要，请生成 1 到 3 个新问题；如果不需要，请返回空数组。
问题必须适合新手，优先选择题，每个问题最多 5 个选项。
只返回 JSON，不要解释。

JSON 格式：
{
  "questions": [
    {
      "id": "detail_level",
      "title": "希望结果多详细？",
      "helper": "这会影响最终 prompt 的深度。",
      "fieldLabel": "详细程度",
      "category": "constraint",
      "required": false,
      "autonomousValue": "详细程度适中，覆盖关键信息。",
      "options": [
        {"id": "normal", "label": "适中", "value": "详细程度适中"}
      ]
    }
  ]
}

用户原始请求：
${originalRequest}

任务类型：
${config.name}

已确认信息：
${answeredSummary || '暂无'}`;

  const raw = await callOpenAI(settings, prompt, true);
  const parsed = parseJsonObject<{ questions?: Array<Partial<PromptQuestion>> }>(raw);
  return Array.isArray(parsed.questions)
    ? parsed.questions.slice(0, 3).map((question, index) => sanitizeQuestion(question, index))
    : [];
}

export async function createAgentFinalPrompt(
  settings: AgentSettings,
  originalRequest: string,
  config: TaskConfig,
  answers: AnswerMap,
): Promise<string> {
  const confirmedInfo = config.questions
    .filter((question) => answers[question.id])
    .map((question) => `- ${question.fieldLabel}：${answers[question.id].value}`)
    .join('\n');

  const prompt = `你是一个专业 Prompt Engineering agent。

请根据用户原始请求、任务类型和已确认信息，生成一段可以直接复制粘贴给其他 AI agent 使用的高质量中文 prompt。

最终 prompt 必须包含这些部分：
1. 角色设定
2. 任务目标
3. 背景信息
4. 输入材料
5. 具体要求
6. 输出格式
7. 质量标准
8. 限制条件
9. 信息不足时的处理方式

要求：
- 只输出最终 prompt 本身，不要输出解释
- 内容要专业、完整、可直接使用
- 如果信息不足，优先写入合理假设策略，而不是要求反复追问
- 根据任务类型自动调整角色、要求、格式和质量标准
- 使用清晰的 Markdown 结构

用户原始请求：
${originalRequest}

任务类型：
${config.name}

已确认信息：
${confirmedInfo || '暂无，需基于合理假设生成。'}`;

  return callOpenAI(settings, prompt, false);
}
