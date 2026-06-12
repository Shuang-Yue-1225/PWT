import { useState } from 'react';
import { Bot, Check, PencilLine } from 'lucide-react';
import { AI_DECIDE_LABEL } from '../data/taskConfigs';
import type { AnswerMap, PromptAnswer, PromptQuestion } from '../types';

interface QuestionPanelProps {
  questions: PromptQuestion[];
  answers: AnswerMap;
  onAnswer: (answer: PromptAnswer) => void;
  onSubmit: () => void;
  onBackToSummary?: () => void;
}

export function QuestionPanel({ questions, answers, onAnswer, onSubmit, onBackToSummary }: QuestionPanelProps) {
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const canSubmit = questions.every((question) => Boolean(answers[question.id]));

  const answerQuestion = (question: PromptQuestion, label: string, value: string, mode: PromptAnswer['mode']) => {
    onAnswer({
      questionId: question.id,
      mode,
      label,
      value,
    });
  };

  return (
    <section className="glass-panel rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">补齐任务细节</h2>
          <p className="mt-1 text-sm text-muted">每轮最多 3 个问题。选不准时，可以放心交给 AI。</p>
        </div>
        {onBackToSummary ? (
          <button className="ghost-button rounded-md px-3 py-2 text-sm" onClick={onBackToSummary}>
            返回摘要
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        {questions.map((question) => {
          const selected = answers[question.id];
          const customValue = customValues[question.id] ?? '';

          return (
            <div key={question.id} className="glass-card rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-ink">{question.title}</div>
                  <p className="mt-1 text-sm leading-6 text-muted">{question.helper}</p>
                </div>
                {selected ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
                    <Check size={14} />
                    已选择
                  </span>
                ) : null}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => {
                  const active = selected?.mode === 'option' && selected.value === option.value;

                  return (
                    <button
                      key={option.id}
                      className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'border-brand bg-brand text-white'
                          : 'ghost-button text-ink'
                      }`}
                      onClick={() => answerQuestion(question, option.label, option.value, 'option')}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <div className="glass-control flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2">
                  <PencilLine className="shrink-0 text-muted" size={16} />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    placeholder="也可以写自己的补充要求"
                    value={customValue}
                    onChange={(event) =>
                      setCustomValues((current) => ({ ...current, [question.id]: event.target.value }))
                    }
                  />
                </div>
                <button
                  className="ghost-button rounded-md px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!customValue.trim()}
                  onClick={() => answerQuestion(question, '自定义要求', customValue.trim(), 'custom')}
                  type="button"
                >
                  使用自定义
                </button>
                <button
                  className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    selected?.mode === 'ai'
                      ? 'bg-brand text-white'
                      : 'ghost-button'
                  }`}
                  onClick={() => answerQuestion(question, AI_DECIDE_LABEL, question.autonomousValue, 'ai')}
                  type="button"
                >
                  <Bot size={16} />
                  {AI_DECIDE_LABEL}
                </button>
              </div>

              {selected ? (
                <div className="glass-control mt-3 rounded-md px-3 py-2 text-sm text-muted">
                  当前：{selected.label}，{selected.value}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        className="mt-5 w-full rounded-md bg-brand px-5 py-3 font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:bg-line"
        disabled={!canSubmit}
        onClick={onSubmit}
        type="button"
      >
        继续
      </button>
    </section>
  );
}
