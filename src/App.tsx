import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { AgentSettingsPanel } from './components/AgentSettingsPanel';
import { BackgroundCustomizer } from './components/BackgroundCustomizer';
import { HomeInput } from './components/HomeInput';
import { ProgressSteps } from './components/ProgressSteps';
import { QuestionPanel } from './components/QuestionPanel';
import { ResultPanel } from './components/ResultPanel';
import { SummaryPanel } from './components/SummaryPanel';
import { TaskAnalysisPanel } from './components/TaskAnalysisPanel';
import { taskConfigMap } from './data/taskConfigs';
import type {
  AnswerMap,
  BackgroundSettings,
  AgentSettings,
  PromptAnswer,
  PromptQuestion,
  TaskAnalysis,
  TaskConfig,
  WorkflowStage,
} from './types';
import { analyzeTask } from './utils/analyzeTask';
import { fillAutonomousAnswers, getNextQuestions, hasEnoughInformation } from './utils/questionFlow';
import { generatePrompt } from './utils/promptGenerator';
import {
  createAgentFinalPrompt,
  createAgentFollowUpQuestions,
  createAgentTaskConfig,
  isAgentReady,
} from './utils/openaiAgent';

function App() {
  const [stage, setStage] = useState<WorkflowStage>('input');
  const [request, setRequest] = useState('');
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [round, setRound] = useState(1);
  const [currentQuestions, setCurrentQuestions] = useState<PromptQuestion[]>([]);
  const [finalPrompt, setFinalPrompt] = useState('');
  const [dynamicConfig, setDynamicConfig] = useState<TaskConfig | null>(null);
  const [agentSettings, setAgentSettings] = useState<AgentSettings>({
    enabled: false,
    apiKey: '',
    model: 'gpt-5.5',
  });
  const [isAgentLoading, setIsAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState('');
  const [background, setBackground] = useState<BackgroundSettings>({
    imageUrl: '',
    overlayOpacity: 0.62,
    source: 'none',
  });
  const [uploadedObjectUrl, setUploadedObjectUrl] = useState('');

  useEffect(() => {
    return () => {
      if (uploadedObjectUrl) {
        URL.revokeObjectURL(uploadedObjectUrl);
      }
    };
  }, [uploadedObjectUrl]);

  const config: TaskConfig | null = useMemo(() => {
    if (dynamicConfig) {
      return dynamicConfig;
    }

    if (!analysis) {
      return null;
    }

    return taskConfigMap[analysis.taskType];
  }, [analysis, dynamicConfig]);

  const startLocalWorkflow = () => {
    const nextAnalysis = analyzeTask(request);
    const nextConfig = taskConfigMap[nextAnalysis.taskType];
    const questions = getNextQuestions(nextConfig, {}, 0);

    setAnalysis(nextAnalysis);
    setDynamicConfig(null);
    setAnswers({});
    setRound(1);
    setCurrentQuestions(questions);
    setFinalPrompt('');
    setStage(questions.length > 0 ? 'questioning' : 'summary');
  };

  const startWorkflow = async () => {
    setAgentError('');

    if (!agentSettings.enabled) {
      startLocalWorkflow();
      return;
    }

    if (!isAgentReady(agentSettings)) {
      setAgentError('请先填写 API key，或关闭 Agent 增强模式。');
      return;
    }

    try {
      setIsAgentLoading(true);
      setStage('loading');
      const result = await createAgentTaskConfig(agentSettings, request.trim());
      const questions = getNextQuestions(result.config, {}, 0);

      setAnalysis({
        taskType: result.analysisTaskType,
        confidence: result.confidence,
        matchedKeywords: ['agent'],
      });
      setDynamicConfig(result.config);
      setAnswers({});
      setRound(1);
      setCurrentQuestions(questions);
      setFinalPrompt('');
      setStage(questions.length > 0 ? 'questioning' : 'summary');
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : 'Agent 调用失败，请检查 API key 或网络。');
      setStage('input');
    } finally {
      setIsAgentLoading(false);
    }
  };

  const updateAnswer = (answer: PromptAnswer) => {
    setAnswers((current) => ({
      ...current,
      [answer.questionId]: answer,
    }));
  };

  const submitQuestionRound = async () => {
    if (!config) {
      return;
    }

    if (hasEnoughInformation(config, answers, round)) {
      setStage('summary');
      return;
    }

    const questions = getNextQuestions(config, answers, round);
    setRound((current) => current + 1);

    if (questions.length === 0) {
      setStage('summary');
    } else {
      setCurrentQuestions(questions);
    }
  };

  const generateFinalPrompt = async () => {
    if (!config) {
      return;
    }

    const completedAnswers = fillAutonomousAnswers(config, answers);
    setAnswers(completedAnswers);

    if (isAgentReady(agentSettings)) {
      try {
        setIsAgentLoading(true);
        setAgentError('');
        setStage('loading');
        const prompt = await createAgentFinalPrompt(agentSettings, request.trim(), config, completedAnswers);
        setFinalPrompt(prompt);
        setStage('result');
      } catch (error) {
        setAgentError(error instanceof Error ? error.message : 'Agent 生成失败，已保留当前信息。');
        setStage('summary');
      } finally {
        setIsAgentLoading(false);
      }
      return;
    }

    setFinalPrompt(generatePrompt(config, request.trim(), completedAnswers));
    setStage('result');
  };

  const continueRefine = async () => {
    if (!config) {
      return;
    }

    const questions = getNextQuestions(config, answers, round);
    if (questions.length === 0) {
      if (isAgentReady(agentSettings) && dynamicConfig) {
        try {
          setIsAgentLoading(true);
          setAgentError('');
          setStage('loading');
          const followUps = await createAgentFollowUpQuestions(agentSettings, request.trim(), dynamicConfig, answers);

          if (followUps.length > 0) {
            const existingIds = new Set(dynamicConfig.questions.map((question) => question.id));
            const uniqueFollowUps = followUps.map((question, index) => ({
              ...question,
              id: existingIds.has(question.id) ? `${question.id}_${round}_${index}` : question.id,
            }));
            const nextConfig = {
              ...dynamicConfig,
              questions: [...dynamicConfig.questions, ...uniqueFollowUps],
            };
            setDynamicConfig(nextConfig);
            setRound((current) => current + 1);
            setCurrentQuestions(uniqueFollowUps);
            setStage('questioning');
          } else {
            await generateFinalPrompt();
          }
        } catch (error) {
          setAgentError(error instanceof Error ? error.message : 'Agent 追问失败，已保留当前信息。');
          setStage('summary');
        } finally {
          setIsAgentLoading(false);
        }
        return;
      }

      await generateFinalPrompt();
      return;
    }

    setRound((current) => current + 1);
    setCurrentQuestions(questions);
    setStage('questioning');
  };

  const modifyQuestion = (question: PromptQuestion) => {
    setCurrentQuestions([question]);
    setStage('questioning');
  };

  const reset = () => {
    setStage('input');
    setRequest('');
    setAnalysis(null);
    setAnswers({});
    setRound(1);
    setCurrentQuestions([]);
    setFinalPrompt('');
    setDynamicConfig(null);
    setAgentError('');
  };

  const handleBackgroundUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    if (uploadedObjectUrl) {
      URL.revokeObjectURL(uploadedObjectUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setUploadedObjectUrl(nextUrl);
    setBackground((current) => ({
      ...current,
      imageUrl: nextUrl,
      source: 'upload',
    }));
  };

  const handleBackgroundUrlChange = (url: string) => {
    if (uploadedObjectUrl) {
      URL.revokeObjectURL(uploadedObjectUrl);
      setUploadedObjectUrl('');
    }

    setBackground((current) => ({
      ...current,
      imageUrl: url.trim(),
      source: url.trim() ? 'url' : 'none',
    }));
  };

  const clearBackground = () => {
    if (uploadedObjectUrl) {
      URL.revokeObjectURL(uploadedObjectUrl);
      setUploadedObjectUrl('');
    }

    setBackground((current) => ({
      ...current,
      imageUrl: '',
      source: 'none',
    }));
  };

  const backgroundStyle: CSSProperties = background.imageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(246, 248, 251, ${background.overlayOpacity}), rgba(246, 248, 251, ${background.overlayOpacity})), url(${JSON.stringify(background.imageUrl)})`,
      }
    : {};

  return (
    <div className="app-background min-h-screen bg-cover bg-center bg-fixed" style={backgroundStyle}>
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <ProgressSteps stage={stage} />
        <AgentSettingsPanel
          error={agentError}
          isLoading={isAgentLoading}
          settings={agentSettings}
          onChange={setAgentSettings}
        />
        <BackgroundCustomizer
          settings={background}
          onClear={clearBackground}
          onOverlayChange={(overlayOpacity) => setBackground((current) => ({ ...current, overlayOpacity }))}
          onUpload={handleBackgroundUpload}
          onUrlChange={handleBackgroundUrlChange}
        />

        <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            {stage === 'input' ? (
              <HomeInput value={request} onChange={setRequest} onStart={startWorkflow} />
            ) : null}

            {stage === 'loading' ? (
              <section className="glass-panel rounded-lg p-5">
                <h2 className="text-lg font-semibold text-ink">Agent 正在工作</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  正在根据你的请求生成追问或最终 prompt。这个过程通常需要几秒钟。
                </p>
              </section>
            ) : null}

            {stage === 'questioning' ? (
              <QuestionPanel
                answers={answers}
                questions={currentQuestions}
                onAnswer={updateAnswer}
                onBackToSummary={config && Object.keys(answers).length > 0 ? () => setStage('summary') : undefined}
                onSubmit={submitQuestionRound}
              />
            ) : null}

            {stage === 'summary' && config ? (
              <SummaryPanel
                answers={answers}
                config={config}
                onContinue={continueRefine}
                onGenerate={generateFinalPrompt}
                onModify={modifyQuestion}
              />
            ) : null}

            {stage === 'result' ? (
              <ResultPanel
                prompt={finalPrompt}
                onBack={() => setStage('summary')}
                onRegenerate={generateFinalPrompt}
                onReset={reset}
              />
            ) : null}
          </div>

          <TaskAnalysisPanel analysis={analysis} answers={answers} config={config} />
        </div>

        <footer className="pb-2 text-center text-xs text-muted">
          默认模式不需要 API key；开启增强模式后，追问与最终 prompt 会由 agent 生成。
        </footer>
      </main>
    </div>
  );
}

export default App;
