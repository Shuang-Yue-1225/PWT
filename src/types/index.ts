export type TaskType =
  | 'writing'
  | 'programming'
  | 'learning'
  | 'organizing'
  | 'analysis'
  | 'creative'
  | 'document'
  | 'general';

export type WorkflowStage = 'input' | 'loading' | 'questioning' | 'summary' | 'result';

export type AnswerMode = 'option' | 'custom' | 'ai';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface PromptQuestion {
  id: string;
  title: string;
  helper: string;
  fieldLabel: string;
  category: 'background' | 'requirement' | 'format' | 'constraint' | 'quality';
  required: boolean;
  options: QuestionOption[];
  autonomousValue: string;
}

export interface TaskConfig {
  id: TaskType;
  name: string;
  description: string;
  keywords: string[];
  defaultRole: string;
  defaultOutputFormat: string;
  defaultRequirements: string[];
  defaultConstraints: string[];
  defaultQualityStandards: string[];
  questions: PromptQuestion[];
}

export interface TaskAnalysis {
  taskType: TaskType;
  confidence: number;
  matchedKeywords: string[];
}

export interface PromptAnswer {
  questionId: string;
  mode: AnswerMode;
  value: string;
  label: string;
}

export type AnswerMap = Record<string, PromptAnswer>;

export interface BackgroundSettings {
  imageUrl: string;
  overlayOpacity: number;
  source: 'none' | 'upload' | 'url';
}

export interface AgentSettings {
  enabled: boolean;
  apiKey: string;
  model: string;
}

export interface AgentTaskPlan {
  taskType: TaskType;
  confidence: number;
  taskName: string;
  taskDescription: string;
  questions: PromptQuestion[];
}

export interface PromptDraft {
  role: string;
  taskGoal: string;
  background: string[];
  inputMaterials: string[];
  requirements: string[];
  outputFormat: string;
  qualityStandards: string[];
  constraints: string[];
  insufficientInfoPolicy: string[];
}
