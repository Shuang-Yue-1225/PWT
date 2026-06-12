import { CheckCircle2 } from 'lucide-react';
import type { AnswerMap, TaskAnalysis, TaskConfig } from '../types';
import { getAnswerSummary } from '../utils/questionFlow';

interface TaskAnalysisPanelProps {
  config: TaskConfig | null;
  analysis: TaskAnalysis | null;
  answers: AnswerMap;
}

export function TaskAnalysisPanel({ config, analysis, answers }: TaskAnalysisPanelProps) {
  if (!config || !analysis) {
    return (
      <aside className="glass-panel rounded-lg p-4">
        <h2 className="font-semibold text-ink">任务分析</h2>
        <p className="mt-2 text-sm leading-6 text-muted">输入任务后，这里会显示识别出的任务类型和已确认信息。</p>
      </aside>
    );
  }

  const summary = getAnswerSummary(config, answers);

  return (
    <aside className="glass-panel rounded-lg p-4">
      <h2 className="font-semibold text-ink">任务分析</h2>

      <div className="glass-card mt-4 rounded-md p-3">
        <div className="text-xs text-muted">识别类型</div>
        <div className="mt-1 font-medium text-ink">{config.name}</div>
        <p className="mt-2 text-sm leading-6 text-muted">{config.description}</p>
        <div className="mt-2 text-xs text-muted">置信度：{Math.round(analysis.confidence * 100)}%</div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium text-ink">已确认信息</div>
        {summary.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-muted">还没有确认细节。先回答几个小问题即可。</p>
        ) : (
          <div className="mt-2 space-y-2">
            {summary.map((item) => (
              <div key={item.id} className="glass-card flex gap-2 rounded-md p-2 text-sm">
                <CheckCircle2 className="mt-0.5 shrink-0 text-brand" size={16} />
                <div>
                  <div className="font-medium text-ink">{item.label}</div>
                  <div className="text-muted">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
