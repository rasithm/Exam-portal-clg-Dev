//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\pages\student\CompilerExam.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/uis/button";
import { Badge } from "@/components/uis/badge";
import { ProblemDescription } from "@/components/compiler/ProblemDescription";
import { CodeEditor } from "@/components/compiler/CodeEditor";
import { QuestionNavigator } from "@/components/compiler/QuestionNavigator";
import { ThemeSelector, EditorTheme, isThemeDark } from "@/components/compiler/ThemeSelector";
import { ExamStartModal } from "@/components/compiler/ExamStartModal";
import { SubmitConfirmModal } from "@/components/compiler/SubmitConfirmModal";
import { useExamSecurity } from "@/hooks/useExamSecurity";
import { ArrowLeft, Clock, AlertTriangle, Shield, Maximize2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SubmitResultModal } from "@/components/compiler/SubmitResultModal";
import { useParams } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "@/constant/Url";

const API_BASE = baseUrl || "http://localhost:5000";

export default function CompilerExam() {
  const navigate = useNavigate();
  const [examStarted, setExamStarted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  

  const [isRunning, setIsRunning] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState<Record<number, number>>({});
  const [editorTheme, setEditorTheme] = useState<EditorTheme>("vs-dark");
  const [runningTestCaseIndex, setRunningTestCaseIndex] = useState<number | undefined>(undefined);
  const [testCaseResults, setTestCaseResults] = useState<Record<number, Record<number, { status: "passed" | "failed"; actualOutput: string }>>>({});
  const [showSubmitResultModal, setShowSubmitResultModal] = useState(false);
  const { isFullscreen, tabSwitchCount, enterFullscreen, exitFullscreen } = useExamSecurity(examStarted);
  const { examId } = useParams();
  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [outputMap, setOutputMap] = useState<Record<string, string>>({});
  


  const [lastRunResult, setLastRunResult] = useState<any>(null);
  // const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [unsavedMap, setUnsavedMap] = useState<Record<string, boolean>>({});

  
  useEffect(() => {
    const fetchCompilerExam = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await axios.get(`${API_BASE}/api/student/compiler-exams/${examId}`, {
          withCredentials: true,
        });
        const { exam } = res.data;

        
        if (!exam?.questions || exam.questions.length === 0) {
          throw new Error("No questions found for this exam.");
        }



        // setExamData({ ...exam, languages: [exam.language?.trim()] });

        
        setQuestions(exam.questions.map(q => ({ ...q, completed: !!q.completed })));
        setExamData({
          ...exam,
          questions: exam.questions.map(q => ({
            ...q,
            id: q._id
          })),
          languages: [exam.language?.trim()]
        });

        if (!localStorage.getItem(`exam-${examId}-start`)) {
          localStorage.setItem(`exam-${examId}-start`, Date.now().toString());
        }


      } catch (err: any) {
        console.error("Compiler exam fetch error:", err);
        const message = err.response?.data?.message || err.message || "Unknown error";
        setError(message);
        toast({
          title: "Exam Load Failed",
          description: message,
          variant: "destructive",
        });

        setTimeout(() => {
          navigate("/student/dashboard");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchCompilerExam();
  }, [examId, navigate]);

  const currentQuestion = examData?.questions?.[currentQuestionIndex] || null;
  const currentQuestionId = currentQuestion?.id;
  const output = currentQuestionId ? outputMap[currentQuestionId] || "" : "";

  useEffect(() => {
    const start = Number(localStorage.getItem(`exam-${examId}-start`));
    if (start && examData?.duration) {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setTimeRemaining(Math.max(examData.duration * 60 - elapsed, 0));
    }
  }, [examData]);

  useEffect(() => {
    if (examData?.questions) {
      setQuestions(examData.questions.map(q => ({ ...q, completed: false })));
    }
  }, [examData]);
  



  

  const [showResultsTable, setShowResultsTable] = useState(false);
  const [tableResults, setTableResults] = useState([]);
  const [testCaseStatuses, setTestCaseStatuses] = useState([]);
  const [submitTestResults, setSubmitTestResults] = useState({ total: 0, passed: 0, failed: 0 });
  

  // Apply dark mode based on theme selection
  

  useEffect(() => {
    const container = document.querySelector(".compiler-theme");
    if (!container) return;

    if (isThemeDark(editorTheme)) {
      container.classList.add("dark");
    } else {
      container.classList.remove("dark");
    }
  }, [editorTheme]);


  // Timer effect
  useEffect(() => {
    if (!examStarted) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        // Warning toasts
        if (prev === 300) {
          toast({
            title: "5 minutes remaining",
            description: "Please wrap up your solutions.",
            variant: "destructive",
          });
        } else if (prev === 60) {
          toast({
            title: "1 minute remaining",
            description: "Time is almost up!",
            variant: "destructive",
          });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted]);

  useEffect(() => {
    const q = examData?.questions?.[currentQuestionIndex];
    if (!q) return;

    setOutputMap(prev => {
      if (prev[q.id] !== undefined) return prev;
      return { ...prev, [q.id]: "" };
    });
  }, [currentQuestionIndex, examData]);

  useEffect(() => {
    if (!currentQuestion?.id) return;

    setOutputMap(prev => ({
      ...prev,
      [currentQuestion.id]: prev[currentQuestion.id] || ""
    }));
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (!currentQuestion?.id) return;

    const qid = currentQuestion.id;
    const stored = testCaseResults[qid];

    if (!stored) {
      setTableResults([]);
      setShowResultsTable(false);
      return;
    }

    const visibleIndexes = currentQuestion.testCases
      .map((tc, i) => ({ tc, i }))
      .filter(x => !x.tc.hidden)
      .map(x => x.i);

    const rebuilt = Object.entries(stored)
      .filter(([i]) => visibleIndexes.includes(Number(i)))
      .map(([i, r], idx) => {
        const tc = currentQuestion.testCases[Number(i)];
        return {
          sno: idx + 1,
          name: `Test Case ${idx + 1}`,
          input: tc.inputs.join(", "),
          expectedOutput: tc.expectedOutput,
          actualOutput: r.actualOutput,
          status: r.status,
        };
      });

    setTableResults(rebuilt);
    setShowResultsTable(rebuilt.length > 0);
  }, [currentQuestionIndex, testCaseResults]);




  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const navigateQuestion = (nextIndex:number) => {
    if (unsavedMap[currentQuestion.id]) {
      const ok = window.confirm("This code is not saved. Continue?");
      if (!ok) return;
    }
    setCurrentQuestionIndex(nextIndex);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading exam...</p>
      </div>
    );
  }

  if (error || !examData || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 font-semibold">{error || "Failed to load exam"}</p>
      </div>
    );
  }
  // if (!currentQuestion.completed && hasUnsavedCode) {
  //   const confirmMove = window.confirm("Your code is not submitted. Navigate anyway?");
  //   if (!confirmMove) return;
  // }


  const handleStartExam = async () => {
    await enterFullscreen();
    setExamStarted(true);
  };
  // if (hasUnsavedChanges) {
  //   const ok = window.confirm("Unsaved code will be lost. Continue?");
  //   if (!ok) return;
  // }




 

// pages/student/compiler/CompilerExam.tsx
// Function: handleRunAll (updated for validation, attempt limit, strict mode, UI sync)

const handleRunAll = async (code: string, language: string) => {
  if (!code?.trim()) {
    toast({
      title: "Code Required",
      description: "Please write your code before evaluating.",
      variant: "destructive",
    });
    return;
  }

  if (!currentQuestion?.testCases || currentQuestion.testCases.length === 0) {
    toast({
      title: "Test Cases Missing",
      description: "No test cases found for this question.",
      variant: "destructive",
    });
    return;
  }

  const attempts = Number(attemptsUsed[currentQuestion.id] || 0);

  const limit = currentQuestion.attemptLimit ?? Infinity;

  if (attempts >= limit) {
    toast({
      title: "Attempts Exhausted",
      description: "This question is already submitted.",
      variant: "destructive",
    });
    return;
  }


  setIsRunning(true);
  
  setOutputMap(prev => ({ ...prev, [currentQuestion.id]: "" }));



  try {
    const res = await axios.post(
      `${API_BASE}/api/student/compiler-exams/run-all`,
      {
        questionId: currentQuestion.id,
        examId,
        sourceCode: code,
        language,
        violationDetected: tabSwitchCount > 2 || !isFullscreen,
      },
      { withCredentials: true }
    );

    const data = res.data;

    // if (data?.violation) {
    //   toast({
    //     title: "Violation Detected",
    //     description: "Exam submitted due to violation.",
    //     variant: "destructive",
    //   });
    //   handleFinalSubmit();
    //   return;
    // }

    if (Array.isArray(data.testCasesResult)) {
      const mappedResults: Record<number, { status: "passed" | "failed"; actualOutput: string }> = {};

      data.testCasesResult.forEach((tc: any, i: number) => {
        mappedResults[i] = {
          status: tc.passed ? "passed" : "failed",
          actualOutput: tc.actualOutput || "",
        };
      });

      setTestCaseResults(prev => ({
        ...prev,
        [currentQuestion.id]: mappedResults,
      }));




      const visibleIndexes = currentQuestion.testCases
        .map((tc, i) => ({ tc, i }))
        .filter(x => !x.tc.hidden)
        .map(x => x.i);

      setTableResults(
        data.testCasesResult
          .filter((_:any, i:number) => visibleIndexes.includes(i))
          .map((tc:any, visibleIdx:number) => ({
            sno: visibleIdx + 1,
            name: `Test Case ${visibleIdx + 1}`,
            input: tc.inputs.join(", "),
            expectedOutput: tc.expectedOutput,
            actualOutput: tc.actualOutput,
            status: tc.passed ? "passed" : "failed",
          }))
      );


      setShowResultsTable(true);

    }

    // setOutput(data.rawOutput || "");
    setOutputMap(prev => ({ ...prev, [currentQuestion.id]: (data.rawOutput || "") }));


    
      setAttemptsUsed(prev => ({
        ...prev,
        [currentQuestion.id]: attempts + 1,
      }));
    


    
    if (data.autoSubmit) {
      if(data.isLastAttempt){
        toast({
          title: "Last attempt used — auto submitted"
            
        });
      }else{
        toast({
          title: "All test cases passed!",
        });
      }
      
      setQuestions(prev =>
        prev.map(q => q.id === currentQuestion.id ? { ...q, completed: true } : q)
      );

      setExamData(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q.id === currentQuestion.id ? { ...q, completed: true } : q
        )
      }));
      setUnsavedMap(prev => ({ ...prev, [currentQuestion.id]: false }));

      if (currentQuestionIndex < examData.questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(i => i + 1);
        }, 800);
      }
      return;

    }


  } catch (err: any) {
    console.error("Run All Error:", err);
    toast({
      title: "Execution Error",
      description: err.response?.data?.message || err.message,
      variant: "destructive",
    });
  } finally {
    setIsRunning(false);
  }
};





  
  const handleRun = async (code: string, language: string, customInput?: string) => {
    if (!code?.trim()) {
      toast({
        title: 'Code required',
        description: 'Write your code before running.',
        variant: 'destructive',
      });
      return;
    }

    // Detect if code expects input but input is missing
    const expectsInput = /input\(|fs\.readFileSync|Scanner|readline/.test(code);
    const inputGiven = customInput?.trim().length > 0;

    if (expectsInput && !inputGiven) {
      toast({
        title: "Missing Input",
        description: "This program expects input. Please provide input in the Custom Input tab.",
        variant: "destructive",
      });
      return;
    }
    
    setOutputMap(prev => ({ ...prev, [currentQuestion.id]: "" }));


    try {
      setIsRunning(true);
      // setOutput("Running your code...");
      setOutputMap(prev => ({ ...prev, [currentQuestion.id]: "Running your code..." }));


      const res = await axios.post(`${API_BASE}/api/student/compiler-exams/run-code`, {
        sourceCode: code,
        language,
        customInput
      }, { withCredentials: true });

      // setOutput(res.data.output || '');
      setOutputMap(prev => ({ ...prev, [currentQuestion.id]: (res.data.output || '') }));

    } catch (err: any) {
      // setOutput(err.response?.data?.message || 'Execution error');
      setOutputMap(prev => ({ ...prev, [currentQuestion.id]: (err.response?.data?.message || 'Execution error') }));

    } finally {
      setIsRunning(false);
      setShowResultsTable(false);
    }
    
  };


  const handleRunTestCase = async (testCaseIndex:number) => {
    const tc = currentQuestion.testCases.filter(tc => !tc.hidden)[testCaseIndex];
    if (!tc) return;
    
    setRunningTestCaseIndex(testCaseIndex);

    try {
      const res = await axios.post(`${API_BASE}/api/student/compiler-exams/run-code`, {
        sourceCode: codeMap[currentQuestion.id],
        language: examData.languages[0],
        customInput: tc.inputs.join("\n")
      }, { withCredentials:true });

      const passed = res.data.output?.trim() === tc.expectedOutput?.trim();
      const actualOutput = passed ? tc.expectedOutput : "Wrong output";
      setTestCaseResults(prev => ({
        ...prev,
        [currentQuestion.id]: {
          ...(prev[currentQuestion.id] || {}),
          [testCaseIndex]: {
            status: passed ? "passed" : "failed",
            actualOutput: res.data.output
          }
        }
      }));

      const tableResult = {
          sno: testCaseIndex + 1,
          name: `Test Case ${testCaseIndex + 1}`,
          input: tc?.inputs.join(", ") || "",
          expectedOutput: tc?.expectedOutput || "",
          actualOutput,
          status: (passed ? "passed" : "failed") as "pending" | "passed" | "failed",
        };
        
        setTableResults([tableResult]);
        setShowResultsTable(true);
        
        // setOutput(`=== Test Case ${testCaseIndex + 1} ===\n\nInput:\n${testCase?.inputs.join("\n")}\n\nExpected: ${testCase?.expectedOutput}\nActual: ${actualOutput}\n\n${passed ? "✓ Passed" : "✗ Failed"}`);
        setOutputMap(prev => ({ ...prev, [currentQuestion.id]: (`=== Test Case ${testCaseIndex + 1} ===\n\nInput:\n${tc?.inputs.join("\n")}\n\nExpected: ${tc?.expectedOutput}\nActual: ${actualOutput}\n\n${passed ? "✓ Passed" : "✗ Failed"}`) }));

        setRunningTestCaseIndex(undefined);

    } finally {
      setRunningTestCaseIndex(undefined);
    }
  };


  const handleSubmit = async (code:string, language:string) => {
    const qid = currentQuestion.id;
    const lastResult = testCaseResults[qid];

    if (!lastResult) {
      await handleRunAll(code, language);
      return;
    }

    const failed = Object.values(lastResult).some(r => r.status === "failed");

    if (failed) {
      const ok = window.confirm("Some test cases failed. Submit anyway?");
      if (!ok) return;
    }

    try {
      await axios.post(`${API_BASE}/api/student/compiler-exams/submit`, {
        examId,
        questionId: qid,
      }, { withCredentials:true });

      toast({ title: "Submission saved" });

      setQuestions(prev =>
        prev.map(q => q.id === qid ? { ...q, completed: true } : q)
      );

      setUnsavedMap(prev => ({ ...prev, [qid]: false }));

    } catch (e:any) {
      toast({ title: "Submit failed", description: e.response?.data?.message, variant:"destructive" });
    }
  };



  const handleFinalSubmit = () => {
    const incomplete = questions.filter(q => !q.completed);
    if (incomplete.length > 0) {
      toast({
        title: "Incomplete Questions",
        description: `You must complete all questions before ending the exam.`,
        variant: "destructive"
      });
      return;
    }

    setShowSubmitModal(false);
    exitFullscreen();
    toast({
      title: "Exam Submitted",
      description: "Your exam has been submitted successfully.",
    });
    navigate("/");
  };

  return (
    <div className={`min-h-screen bg-background flex flex-col compiler-theme ${isThemeDark(editorTheme) ? "dark" : ""}`}>
      {/* Exam Start Modal */}
      <ExamStartModal
        open={!examStarted}
        examTitle={examData.title}
        duration={examData.duration}
        questionCount={examData.questions.length}
        selectedTheme={editorTheme}
        onThemeChange={setEditorTheme}
        onStart={handleStartExam}
      />

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleFinalSubmit}
        questions={questions.map(q => ({
          id: q.id,
          title: q.title,
          completed: q.completed,
          current: q.id === currentQuestion.id,
        }))}

      />
      <SubmitResultModal
        open={showSubmitResultModal}
        onClose={() => setShowSubmitResultModal(false)}
        onConfirmSubmit={handleFinalSubmit}
        totalTestCases={submitTestResults.total}
        passedTestCases={submitTestResults.passed}
        failedTestCases={submitTestResults.failed}
      />


      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card backdrop-blur-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} disabled={examStarted}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm">{examData.title}</h1>
              <p className="text-xs text-muted-foreground">
                Question {currentQuestionIndex + 1} of {examData.questions.length}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Security Indicators */}
            {examStarted && (
              <>
                {tabSwitchCount > 0 && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    {tabSwitchCount} tab switch(es)
                  </Badge>
                )}
                <Badge variant={isFullscreen ? "secondary" : "destructive"} className="gap-1 text-xs">
                  {isFullscreen ? (
                    <>
                      <Shield className="w-3 h-3" />
                      Secure
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3 h-3" />
                      <span className="cursor-pointer" onClick={enterFullscreen}>
                        Enter Fullscreen
                      </span>
                    </>
                  )}
                </Badge>
              </>
            )}
            
            {/* Theme Selector (only in exam) */}
            {examStarted && (
              <ThemeSelector value={editorTheme} onChange={setEditorTheme} />
            )}

            <Badge
              variant={timeRemaining < 600 ? "destructive" : "secondary"}
              className="gap-1.5 py-1 px-3 text-sm font-mono  bg-gray-800 text-cyan-50 hover:bg-gray-800 hover:text-cyan-50"
            >
              {timeRemaining < 600 && <AlertTriangle className="w-3.5 h-3.5" />}
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeRemaining)}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowSubmitModal(true)}
              disabled={!examStarted}
            >
              End Exam
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Fixed height layout */}
      <main className="flex-1 grid lg:grid-cols-2 gap-0 min-h-0 h-[calc(100vh-3.5rem)]">
        {/* Left Panel - Problem Description - Fixed height */}
        <div className="border-r border-border overflow-hidden flex flex-col h-full">
          <div className="flex-1 overflow-auto p-4 h-full">
            <ProblemDescription
              examTitle={examData.title}
              questionTitle={currentQuestion.title}
              difficulty={currentQuestion.difficulty}
              evaluationMode={currentQuestion.evaluationMode}
              shortDescription={currentQuestion.shortDescription}
              longDescription={currentQuestion.longDescription}
              inputFormat={currentQuestion.inputFormat}
              outputFormat={currentQuestion.outputFormat}
              sampleInput={currentQuestion.sampleInput}
              sampleOutput={currentQuestion.sampleOutput}
              
              testCases={(currentQuestion.testCases || []).map((tc, i) => {
                const result = testCaseResults[currentQuestion.id]?.[i];
                return {
                  inputs: tc.inputs,
                  expectedOutput: tc.expectedOutput,
                  isHidden: tc.hidden, // ✅ convert backend 'hidden' to frontend 'isHidden'
                  status: result?.status,
                  actualOutput: result?.actualOutput,
                };
              })}


              attemptLimit={currentQuestion.attemptLimit}
              attemptsUsed={attemptsUsed[currentQuestion.id] || 0}
              onRunTestCase={handleRunTestCase}
              runningTestCaseIndex={runningTestCaseIndex}
              showResultsTable={showResultsTable}
              tableResults={tableResults}
              
  
            />
          </div>
        </div>

        {/* Right Panel - Code Editor - Fixed height */}
        <div className="flex flex-col overflow-hidden h-full">
          <div className="flex-1 p-4 overflow-hidden min-h-0">
            <CodeEditor
              languages={examData.languages}
              onRun={handleRun}
              onRunAll={handleRunAll}
              onSubmit={handleSubmit}
              isRunning={isRunning}
              output={output}
              editorTheme={editorTheme}
              testCaseStatuses={testCaseStatuses}
              code={codeMap[currentQuestion.id] || ""}
              onCodeChange={(c) => {
                setCodeMap(prev => ({ ...prev, [currentQuestion.id]: c }));
                setUnsavedMap(prev => ({ ...prev, [currentQuestion.id]: true }));
              }}
              isLocked={attemptsUsed[currentQuestion.id] >= currentQuestion.attemptLimit}
            />
          </div>

          {/* Question Navigator - Fixed at bottom */}
          <div className="border-t border-border p-4 bg-muted/30 flex-shrink-0">
            <QuestionNavigator
              questions={examData.questions.map((q) => ({
                id: q.id,
                title: q.title,
                completed: q.completed,
                current: q.id === currentQuestion.id,
              }))}
              currentIndex={currentQuestionIndex}
              onNavigate={navigateQuestion}
              onNext={() => navigateQuestion(currentQuestionIndex + 1)}
              onPrevious={() => navigateQuestion(currentQuestionIndex - 1)}

            />
          </div>
        </div>
      </main>
    </div>
  );
}
