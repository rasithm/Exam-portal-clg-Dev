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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabViolationCount, setTabViolationCount] = useState(0);
  const [softTabCount, setSoftTabCount] = useState(0);

  const [examStarted, setExamStarted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showReenter, setShowReenter] = useState(false);
  const [violationReason, setViolationReason] = useState<null | "tab" | "fullscreen" | "devtools" | "shortcut">(null);


  const [isRunning, setIsRunning] = useState(false);
  const [isRunningAll, setIsRunningAll] = useState(false);
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [devToolCount, setDevToolCount] = useState(0);
  const [shortcutCount, setShortcutCount] = useState(0);
  const [lastVisibilityHiddenAt, setLastVisibilityHiddenAt] = useState<number | null>(null);



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

        // if (!localStorage.getItem(`exam-${examId}-start`)) {
        //   localStorage.setItem(`exam-${examId}-start`, Date.now().toString());
        // }


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


  useEffect(() => {
    if (!examStarted) return;

    setDevToolCount(0);
    setShortcutCount(0);
    setFullscreenExitCount(0);
  }, [examStarted]);

  

  useEffect(() => {
    if (!examStarted) return;

    const detectDevTools = (e: KeyboardEvent) => {
      const blocked =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "u");

      if (!blocked) return;

      e.preventDefault();

      setDevToolCount(c => {
        const next = c + 1;

        if (next === 1) {
          toast({ title: "Warning", description: "DevTools detected" });
        } else if (next === 2) {
          toast({
            title: "Second Warning",
            description: "You will be logged out",
            variant: "destructive",
          });
          setTimeout(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace("/login"); // hard reload

          }, 1500);
        } else if (next >= 3) {
          handleFinalSubmit("violation");
        }

        return next;
      });
    };

    document.addEventListener("keydown", detectDevTools);
    return () => document.removeEventListener("keydown", detectDevTools);
  }, [examStarted]);

  useEffect(() => {
  if (!examStarted) return;

  const lockKey = `compiler-exam-lock-${examId}`;
  const myId = crypto.randomUUID();

  localStorage.setItem(lockKey, myId);

  const interval = setInterval(() => {
    if (isSubmitting) return;

    const activeId = localStorage.getItem(lockKey);

    if (activeId && activeId !== myId) {
      const now = Date.now();
      const recentlyHidden =
        lastVisibilityHiddenAt && now - lastVisibilityHiddenAt < 3000; // 3s window

      const isLikelyCheating = !recentlyHidden;


      if (isLikelyCheating) {
        setTabViolationCount(c => c + 1);
        setViolationReason("tab");

        toast({
          title: "Warning",
          description: "Multiple exam tabs detected",
          variant: "destructive",
        });
      } else {
        setSoftTabCount(c => c + 1); // back/refresh
      }
    }

  }, 2000);

  return () => {
    clearInterval(interval);
  };
}, [examStarted]);

useEffect(() => {
  if (!examStarted) return;

  const blockClipboard = (e: ClipboardEvent) => {
    e.preventDefault();
    setViolationReason("shortcut");

    toast({
      title: "Action blocked",
      description: "Copy / Paste / Cut is disabled during exam",
      variant: "destructive",
    });
  };

  document.addEventListener("copy", blockClipboard);
  document.addEventListener("cut", blockClipboard);
  document.addEventListener("paste", blockClipboard);

  return () => {
    document.removeEventListener("copy", blockClipboard);
    document.removeEventListener("cut", blockClipboard);
    document.removeEventListener("paste", blockClipboard);
  };
}, [examStarted]);


useEffect(() => {
  if (!examStarted) return;

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      setLastVisibilityHiddenAt(Date.now());
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => document.removeEventListener("visibilitychange", onVisibilityChange);
}, [examStarted]);


  useEffect(() => {
    const handleUnload = () => {
      localStorage.removeItem(`compiler-exam-lock-${examId}`);
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [examId]);

  useEffect(() => {
    if (!examStarted || isSubmitting) return;

    // HARD cheating
    if (tabViolationCount >= 3) {
      handleFinalSubmit("violation");
    }

    // Soft actions (back/refresh abuse)
    if (softTabCount >= 5) {
      handleFinalSubmit("violation");
    }
  }, [tabViolationCount, softTabCount]);





  useEffect(() => {
    if (!examStarted) return;

    const onShortcut = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInEditor = !!target.closest(".monaco-editor");

      // ✅ Ignore editor shortcuts
      if (isInEditor) return;

      // ❌ Only count dangerous shortcuts
      const dangerous =
        e.ctrlKey ||
        e.metaKey ||
        e.altKey;

      if (!dangerous) return;

      e.preventDefault();

      setShortcutCount(c => {
        const next = c + 1;

        toast({
          title: "Shortcut Disabled",
          description: `Unauthorized shortcut detected (${next}/60)`,
          variant: next % 5 === 0 ? "destructive" : "default",
        });

        if (next >= 60) {
          handleFinalSubmit("violation");
        }

        return next;
      });
    };

    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, [examStarted]);




  useEffect(() => {
    if (!examStarted) return;

    const tabViolation = tabSwitchCount >= 15;
    const fullscreenViolation = fullscreenExitCount >= 15;


    if ((tabViolation || fullscreenViolation) && !isSubmitting) {
      toast({
        title: "Security violation",
        description: "Exam auto-submitted due to repeated violations",
        variant: "destructive"
      });

      handleFinalSubmit("violation");
    }

  }, [tabSwitchCount, fullscreenExitCount, examStarted]);



  

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
          handleFinalSubmit("time");
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
    const start = Number(localStorage.getItem(`exam-${examId}-start`));
    if (start && examData?.duration) {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setTimeRemaining(Math.max(examData.duration * 60 - elapsed, 0));
    }
  }, [examData]);


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


  useEffect(() => {
    if (!examStarted) return;

    const handleFsChange = () => {
      const active = !!document.fullscreenElement;

      if (!active) {
        setFullscreenExitCount(c => c + 1);
        setShowReenter(true);
      } else {
        setShowReenter(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, [examStarted]);





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
    try {
      const res = await axios.post(
        `${API_BASE}/api/student/exams/${examId}/start`,
        {},
        { withCredentials: true }
      );

      const data = res.data;

      setSessionId(data.sessionId);
      setExamStarted(true);

      if (data.endTime) {
        const end = new Date(data.endTime).getTime();
        const now = Date.now();
        setTimeRemaining(Math.max(0, Math.floor((end - now) / 1000)));
      } else if (examData?.duration) {
        setTimeRemaining(examData.duration * 60);
      }

      await enterFullscreen();

    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;

      toast({
        title: "Cannot start exam",
        description: msg,
        variant: "destructive",
      });

      navigate("/student/dashboard");
    }
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


  setIsRunningAll(true);
  
  setOutputMap(prev => ({ ...prev, [currentQuestion.id]: "" }));



  try {
    const res = await axios.post(
      `${API_BASE}/api/student/compiler-exams/run-all`,
      {
        questionId: currentQuestion.id,
        examId,
        sourceCode: code,
        language,
        violationDetected: tabSwitchCount >= 15  || !isFullscreen,
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

      const total = data.testCasesResult.length;
      const passed = data.testCasesResult.filter(tc => tc.passed).length;
      const failed = total - passed;

      




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
    setIsRunningAll(false);
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

    if (questions[currentQuestionIndex].completed) {
      toast({ title: "Already submitted" });
      return;
    }

    if (!lastResult) {
      toast({ title: "Please run evaluation first", variant: "destructive" });
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
        code: codeMap[qid],
        results: testCaseResults[qid],
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

  const openEndExamModal = async () => {
     if (isSubmitting) return;
    setShowSubmitModal(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/student/compiler-exams/${examId}/status`,
        { withCredentials: true }
      );

      const { completedQuestionIds } = res.data;

      setQuestions(prev =>
        prev.map(q => ({
          ...q,
          completed: completedQuestionIds.includes(q.id),
        }))
      );

      setShowSubmitModal(true);

    } catch (err:any) {
      toast({
        title: "Unable to verify exam status",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };




  const handleFinalSubmit = async (reason: "manual" | "time" | "violation" = "manual") => {
    if (isSubmitting) return; // 🔒 STOP duplicate calls
    setIsSubmitting(true);
    try {
      localStorage.removeItem(`compiler-exam-lock-${examId}`);
      await axios.post(`${API_BASE}/api/student/compiler-exams/end`, {
        examId,
        reason,
        violations: {
          tabSwitchCount,
          fullscreenExitCount,
          devToolCount,
          shortcutCount,
          violationReason,
        },
      }, { withCredentials: true });

      exitFullscreen();
      navigate(`/student/compiler-exams/${examId}/result` , { replace: true });

    } catch (err:any) {
      toast({
        title: "Cannot submit exam",
        description: err.response?.data?.message || err.message,
        variant: "destructive"
      });
    }
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
        onConfirm={() => handleFinalSubmit("manual")}
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
        onConfirmSubmit={() => handleFinalSubmit("manual")}
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
              onClick={openEndExamModal}
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
              isRunningAll={isRunningAll}
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
      {showReenter && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white text-lg font-semibold mb-4">
              Fullscreen is required to continue the exam
            </p>
            <Button variant="destructive" onClick={enterFullscreen}>
              Re-Enter Fullscreen
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
