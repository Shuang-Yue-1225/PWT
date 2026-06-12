import { useState } from 'react';
import { Check, Copy, RotateCcw, Undo2 } from 'lucide-react';
import { copyText } from '../utils/clipboard';

interface ResultPanelProps {
  prompt: string;
  onRegenerate: () => void;
  onBack: () => void;
  onReset: () => void;
}

export function ResultPanel({ prompt, onRegenerate, onBack, onReset }: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="glass-panel rounded-lg p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">最终 Prompt</h2>
          <p className="mt-1 text-sm text-muted">可以直接复制给其他 AI agent 使用。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brandDark"
            onClick={handleCopy}
            type="button"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制'}
          </button>
          <button className="ghost-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm" onClick={onBack} type="button">
            <Undo2 size={16} />
            返回修改
          </button>
          <button className="ghost-button inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm" onClick={onRegenerate} type="button">
            <RotateCcw size={16} />
            重新生成
          </button>
          <button className="ghost-button rounded-md px-3 py-2 text-sm" onClick={onReset} type="button">
            新任务
          </button>
        </div>
      </div>

      <pre className="glass-control mt-5 max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md p-4 text-sm leading-7 text-ink">
        {prompt}
      </pre>
    </section>
  );
}
