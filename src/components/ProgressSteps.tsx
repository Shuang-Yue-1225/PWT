import type { WorkflowStage } from '../types';

const steps: Array<{ id: WorkflowStage; label: string }> = [
  { id: 'input', label: '输入需求' },
  { id: 'questioning', label: '确认细节' },
  { id: 'summary', label: '确认摘要' },
  { id: 'result', label: '复制结果' },
];

interface ProgressStepsProps {
  stage: WorkflowStage;
}

export function ProgressSteps({ stage }: ProgressStepsProps) {
  const activeIndex = stage === 'loading' ? 1 : steps.findIndex((step) => step.id === stage);

  return (
    <nav className="glass-panel grid gap-2 rounded-lg p-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const active = index <= activeIndex;

        return (
          <div
            key={step.id}
            className={`rounded-md px-3 py-2 text-center text-sm font-medium ${
              active ? 'bg-brand text-white' : 'glass-card text-muted'
            }`}
          >
            {index + 1}. {step.label}
          </div>
        );
      })}
    </nav>
  );
}
