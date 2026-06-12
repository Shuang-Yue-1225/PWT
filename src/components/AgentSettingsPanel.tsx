import { Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { AgentSettings } from '../types';

interface AgentSettingsPanelProps {
  settings: AgentSettings;
  isLoading: boolean;
  error: string;
  onChange: (settings: AgentSettings) => void;
}

export function AgentSettingsPanel({ settings, isLoading, error, onChange }: AgentSettingsPanelProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <span className="rounded-md bg-gradient-to-br from-blue-100/80 to-pink-100/70 p-2 text-brand">
            <Sparkles size={18} />
          </span>
          Agent 增强模式
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            className="h-4 w-4 accent-brand"
            type="checkbox"
            checked={settings.enabled}
            onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
          />
          使用 API key 生成追问和 prompt
        </label>

        <div className="glass-control flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2">
          <KeyRound className="shrink-0 text-muted" size={16} />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="粘贴 OpenAI API key"
            type={showKey ? 'text' : 'password'}
            value={settings.apiKey}
            onChange={(event) => onChange({ ...settings, apiKey: event.target.value })}
          />
          <button
            className="text-muted hover:text-brand"
            onClick={() => setShowKey((current) => !current)}
            title={showKey ? '隐藏 key' : '显示 key'}
            type="button"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <input
          className="glass-control w-full rounded-md px-3 py-2 text-sm outline-none focus:border-brand lg:w-36"
          placeholder="模型"
          value={settings.model}
          onChange={(event) => onChange({ ...settings, model: event.target.value })}
        />
      </div>

      <div className="mt-2 text-xs leading-5 text-muted">
        {settings.enabled
          ? '增强模式会在浏览器中直接调用 OpenAI API。API key 只保存在当前页面状态中，刷新后会消失；公开产品建议改成后端代理。'
          : '关闭时使用本地规则，不需要 API key。'}
      </div>

      {isLoading ? <div className="mt-2 text-xs text-brand">Agent 正在处理，请稍等...</div> : null}
      {error ? <div className="mt-2 rounded-md bg-red-50/80 px-3 py-2 text-xs text-red-700">{error}</div> : null}
    </section>
  );
}
