import { type CSSProperties, useEffect, useMemo, useState } from 'react';
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
  PromptAnswer,
  PromptQuestion,
  TaskAnalysis,
  TaskConfig,
  WorkflowStage,
} from './types';
import { analyzeTask } from './utils/analyzeTask';
import { fillAutonomousAnswers, getNextQuestions, hasEnoughInformation } from './utils/questionFlow';
import { generatePrompt } from './utils/promptGenerator';

function App() {
  const [stage, setStage] = useState<WorkflowStage>('input');
  const [request, setRequest] = useState('');
  const [analysis, setAnalysis] = useState<TaskAnalysis | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [round, setRound] = useState(1);
  const [currentQuestions, setCurrentQuestions] = useState<PromptQuestion[]>([]);
  const [finalPrompt, setFinalPrompt] = useState('');
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
    if (!analysis) {
      return null;
    }

    return taskConfigMap[analysis.taskType];
  }, [analysis]);

  const startWorkflow = () => {
    const nextAnalysis = analyzeTask(request);
    const nextConfig = taskConfigMap[nextAnalysis.taskType];
    const questions = getNextQuestions(nextConfig, {}, 0);

    setAnalysis(nextAnalysis);
    setAnswers({});
    setRound(1);
    setCurrentQuestions(questions);
    setFinalPrompt('');
    setStage(questions.length > 0 ? 'questioning' : 'summary');
  };

  const updateAnswer = (answer: PromptAnswer) => {
    setAnswers((current) => ({
      ...current,
      [answer.questionId]: answer,
    }));
  };

  const submitQuestionRound = () => {
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

  const generateFinalPrompt = () => {
    if (!config) {
      return;
    }

    // 未追问到的信息统一交给 AI 自主决定，保证最终 prompt 始终完整可用。
    const completedAnswers = fillAutonomousAnswers(config, answers);
    setAnswers(completedAnswers);
    setFinalPrompt(generatePrompt(config, request.trim(), completedAnswers));
    setStage('result');
  };

  const continueRefine = () => {
    if (!config) {
      return;
    }

    const questions = getNextQuestions(config, answers, round);
    if (questions.length === 0) {
      generateFinalPrompt();
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
          TODO：后续可把任务识别、追问策略和 prompt 评分接入真实大模型 API。
        </footer>
      </main>
    </div>
  );
}

export default App;
