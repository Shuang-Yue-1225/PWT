import { Wand2 } from 'lucide-react';
import type { AnswerMap, PromptQuestion, TaskConfig } from '../types';
import { getAnswerSummary } from '../utils/questionFlow';

interface SummaryPanelProps {
  config: TaskConfig;
  answers: AnswerMap;
  onGenerate: () => void;
  onContinue: () => void;
  onModify: (question: PromptQuestion) => void;
}

export function SummaryPanel({ config, answers, onGenerate, onContinue, onModify }: SummaryPanelProps) {
  const summary = getAnswerSummary(config, answers);

  return (
    <section className="glass-panel rounded-lg p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-gradient-to-br from-blue-100/80 to-pink-100/70 p-2 text-brand">
          <Wand2 size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">生成前确认</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            信息已经足够生成 prompt。你可以直接生成，也可以继续细化或修改某一项。
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {summary.map((item) => {
          const question = config.questions.find((candidate) => candidate.id === item.id);

          return (
            <div key={item.id} className="glass-card flex flex-col gap-2 rounded-md p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium text-ink">{item.label}</div>
                <div className="mt-1 text-sm text-muted">{item.value}</div>
              </div>
              {question ? (
                <button
                  className="ghost-button rounded-md px-3 py-2 text-sm"
                  onClick={() => onModify(question)}
                  type="button"
                >
                  修改
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button className="rounded-md bg-brand px-4 py-3 font-medium text-white hover:bg-brandDark" onClick={onGenerate} type="button">
          直接生成 prompt
        </button>
        <button className="ghost-button rounded-md px-4 py-3 font-medium text-ink" onClick={onContinue} type="button">
          继续细化
        </button>
        <button className="ghost-button rounded-md px-4 py-3 font-medium text-ink" onClick={() => config.questions[0] && onModify(config.questions[0])} type="button">
          修改需求
        </button>
      </div>
    </section>
  );
}
