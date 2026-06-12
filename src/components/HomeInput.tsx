import { Sparkles } from 'lucide-react';

interface HomeInputProps {
  value: string;
  onChange: (value: string) => void;
  onStart: () => void;
}

const examples = ['帮我写一篇论文', '帮我做一个密码学复习资料', '帮我分析一段代码', '帮我生成一个实验报告'];

export function HomeInput({ value, onChange, onStart }: HomeInputProps) {
  return (
    <section className="glass-panel rounded-lg p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-gradient-to-br from-blue-100/80 to-pink-100/70 p-2 text-brand">
          <Sparkles size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Prompt 生成工具</h1>
          <p className="mt-1 text-sm leading-6 text-muted">
            先写一句简单需求，我会用少量选择题帮你补齐细节，最后生成可直接复制给其他 AI 的专业 prompt。
          </p>
        </div>
      </div>

      <textarea
        className="glass-control mt-5 min-h-32 w-full rounded-md p-4 text-base leading-7 outline-none transition focus:border-brand focus:bg-white/80 focus:ring-4 focus:ring-brand/10"
        placeholder="例如：帮我做一个密码学复习资料"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            className="ghost-button rounded-md px-3 py-2 text-sm"
            onClick={() => onChange(example)}
            type="button"
          >
            {example}
          </button>
        ))}
      </div>

      <button
        className="mt-5 w-full rounded-md bg-brand px-5 py-3 font-medium text-white transition hover:bg-brandDark disabled:cursor-not-allowed disabled:bg-line"
        disabled={!value.trim()}
        onClick={onStart}
        type="button"
      >
        开始生成 prompt
      </button>
    </section>
  );
}
