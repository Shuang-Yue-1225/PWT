import { taskConfigs } from '../data/taskConfigs';
import type { TaskAnalysis, TaskType } from '../types';

const normalize = (text: string) => text.toLowerCase().trim();

export function analyzeTask(input: string): TaskAnalysis {
  const normalized = normalize(input);

  const scores = taskConfigs.map((config) => {
    const matchedKeywords = config.keywords.filter((keyword) =>
      normalized.includes(keyword.toLowerCase()),
    );

    let score = matchedKeywords.length * 3;

    if (config.id === 'programming' && /html|css|js|ts|api|bug|react|vue|python/i.test(input)) {
      score += 4;
    }

    if (config.id === 'document' && /报告|实验|文档|方案书/.test(input)) {
      score += 4;
    }

    if (config.id === 'learning' && /复习|考试|知识点|资料|学习/.test(input)) {
      score += 3;
    }

    return { config, matchedKeywords, score };
  });

  const best = scores.sort((a, b) => b.score - a.score)[0];
  const fallbackType: TaskType = 'general';

  if (!best || best.score <= 0) {
    return {
      taskType: fallbackType,
      confidence: 0.45,
      matchedKeywords: [],
    };
  }

  return {
    taskType: best.config.id,
    confidence: Math.min(0.95, 0.55 + best.score * 0.06),
    matchedKeywords: best.matchedKeywords,
  };
}
