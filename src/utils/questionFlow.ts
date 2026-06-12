import { AI_DECIDE_LABEL } from '../data/taskConfigs';
import type { AnswerMap, PromptAnswer, PromptQuestion, TaskConfig } from '../types';

export const MAX_QUESTIONS_PER_ROUND = 3;
export const MAX_ROUNDS = 4;

export function createAiAnswer(question: PromptQuestion): PromptAnswer {
  return {
    questionId: question.id,
    mode: 'ai',
    label: AI_DECIDE_LABEL,
    value: question.autonomousValue,
  };
}

export function getNextQuestions(
  config: TaskConfig,
  answers: AnswerMap,
  round: number,
): PromptQuestion[] {
  const unanswered = config.questions.filter((question) => !answers[question.id]);
  const required = unanswered.filter((question) => question.required);
  const optional = unanswered.filter((question) => !question.required);

  if (round >= MAX_ROUNDS) {
    return [];
  }

  return [...required, ...optional].slice(0, MAX_QUESTIONS_PER_ROUND);
}

export function hasEnoughInformation(config: TaskConfig, answers: AnswerMap, round: number): boolean {
  const requiredPending = config.questions.some((question) => question.required && !answers[question.id]);
  const allAnswered = config.questions.every((question) => Boolean(answers[question.id]));
  return !requiredPending || allAnswered || round >= MAX_ROUNDS;
}

export function fillAutonomousAnswers(config: TaskConfig, answers: AnswerMap): AnswerMap {
  const completed = { ...answers };

  for (const question of config.questions) {
    if (!completed[question.id]) {
      completed[question.id] = createAiAnswer(question);
    }
  }

  return completed;
}

export function getAnswerSummary(config: TaskConfig, answers: AnswerMap) {
  return config.questions
    .filter((question) => answers[question.id])
    .map((question) => ({
      id: question.id,
      label: question.fieldLabel,
      value: answers[question.id].value,
      mode: answers[question.id].mode,
    }));
}
