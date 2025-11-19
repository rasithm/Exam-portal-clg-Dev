//C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\proctor-plus-suite\src\pages\ExamInterface.tsx
import { useState, useEffect , useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
// import { toast } from "sonner";
import { 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  Flag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { baseUrl } from "../constant/Url";
const API_BASE = baseUrl || "http://localhost:5000";

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const startedRef = useRef(false);
  // Exam state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours in seconds
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [showReenter, setShowReenter] = useState(true);
  const [shortcutCount, setShortcutCount] = useState(0);

  // Sample exam data
  // Exam data from backend
  const [examData, setExamData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (startedRef.current) return; // ✅ prevent multiple calls
    startedRef.current = true;
    // Start session first, then fetch exam. This must be sequential.
    const init = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // 1) start session
        const startRes = await fetch(`${API_BASE}/api/student/exams/${examId}/start`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!startRes.ok) {
          const errText = await startRes.text();
          const errMsg = JSON.parse(errText).message || "Unknown error";

          if (errMsg.includes("Active exam exists")) {
            toast({
              title: "Exam Already Active",
              description: "You already have an active session for this exam. Please continue it on your original device or browser.",
              variant: "destructive",
            });
            navigate("/student/dashboard");
            return;
          }

          throw new Error(`Start failed: ${startRes.status} ${errText}`);
          console.log(`Start failed: ${startRes.status} ${errText}`)
        }

        const startJson = await startRes.json();
        // backend returns { message, sessionId, token } — store sessionId
        const sid = startJson.sessionId || startJson.session?.id || startJson.sessionId;
        if (!sid) {
          // still continue but warn
          console.warn("No sessionId returned from start", startJson);
        } else {
          setSessionId(sid);
        }

        // 2) fetch questions (only after start succeeded)
        await new Promise(resolve => setTimeout(resolve, 1500));
        const res = await fetch(`${API_BASE}/api/student/exams/${examId}`, {
          credentials: "include",
        });

        // if (!res.ok) {
        //   const txt = await res.text();
        //   throw new Error(`GetExam failed: ${res.status} ${txt}`);
        // }
        if (!res.ok) {
          const txt = await res.text();
          const msg = (() => {
            try {
              return JSON.parse(txt).message;
            } catch {
              return txt;
            }
          })();

          if (res.status === 410) {
            // Try one retry in case it was a temporary timing sync issue
            await new Promise(resolve => setTimeout(resolve, 1000));
            const retry = await fetch(`${API_BASE}/api/student/exams/${examId}`, { credentials: "include" });
            if (retry.ok) {
              const retryData = await retry.json();
              setExamData(retryData);
              setTimeRemaining((retryData.duration || 120) * 60);
              setLoading(false);
              return;
            }

            // If still failed, show toast
            toast({
              title: "Session Expired",
              description: "Your exam session has expired. Please contact your instructor.",
              variant: "destructive",
            });
            navigate("/student/dashboard");
            return;
          }


          throw new Error(`GetExam failed: ${res.status} ${msg}`);
        }

        const data = await res.json();
        setExamData(data); 
        // Ensure questions array exists
        if (!data?.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error("No questions returned from server");
        }

        if (data.answers) {
          setAnswers(data.answers);     // ✅ pre-fill from backend
        }


        // ✅ calculate remaining time from sessionEndTime
        let remainingSeconds = (data.duration || 120) * 60;
        if (data.sessionEndTime) {
          const endMs = new Date(data.sessionEndTime).getTime();
          const nowMs = Date.now();
          remainingSeconds = Math.max(0, Math.floor((endMs - nowMs) / 1000));
        }
        setTimeRemaining(remainingSeconds);

        setLoading(false);

      } catch (err: any) {
        console.error("Init exam error:", err);
        setLoadError(err.message || "Failed to start or load exam.");
        setLoading(false);
        toast({
          title: "Error loading exam",
          description: err.message || "Unable to fetch exam questions.",
          variant: "destructive",
        });
        // navigate back after short pause (optional)
        setTimeout(() => navigate("/student/dashboard"), 1200);
      }
    };

    init();
  }, [examId, navigate, toast]);

  useEffect(() => {
    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn("Initial fullscreen request failed", err);
          // If blocked, show overlay so student must click to resume
          setShowReenter(true);
        });
      }
    };

    enterFullscreen();
  }, []);


  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && !examSubmitted) {
        logEvent("fullscreen_exit");

        // Try to immediately re-enter fullscreen
        document.documentElement
          .requestFullscreen()
          .then(() => {
            setShowReenter(false);
          })
          .catch((err) => {
            console.warn("Automatic fullscreen re-entry failed", err);
            // Browser blocked auto re-entry; require manual click
            setShowReenter(true);
          });
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, [examSubmitted]);



  
  // useEffect(() => {
  //   const handleFullScreenChange = () => {
  //     if (!document.fullscreenElement && !examSubmitted) {
        
  //       logEvent("fullscreen_exit");

        
  //       setTimeout(() => {
  //         if (!document.fullscreenElement && !examSubmitted) {
  //           document.documentElement.requestFullscreen().catch(() => {
              
  //             setShowReenter(true);
  //           });
  //         }
  //       }, 1000);
  //     }
  //   };

  //   document.addEventListener("fullscreenchange", handleFullScreenChange);
  //   return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  // }, [examSubmitted]);


  const handleReEnterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setShowReenter(false);
        })
        .catch((err) => {
          console.warn("Fullscreen re-entry failed", err);
        });
    } else {
      setShowReenter(false);
    }
  };


  






  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    // Disable right-click
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", disableContextMenu);

    // Disable keyboard shortcuts (Ctrl, F12, etc.)
    const disableShortcuts = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      const isBlocked =
        e.keyCode === 123 ||              // F12
        e.key === "Escape" ||             // ESC → often exits fullscreen
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        [73, 74, 85, 67, 86, 88, 83].includes(e.keyCode); // I, J, U, C, V, X, S

      if (isBlocked) {
        e.preventDefault();
        e.stopPropagation();
        setShortcutCount((prev) => prev + 1);   // ✅ count shortcut usage
        logEvent("shortcut");                   // ✅ backend event
        toast({
          title: "Security Alert",
          description: "Shortcut keys are disabled during the exam!",
          variant: "destructive",
        });
      }
    };

    document.addEventListener("keydown", disableShortcuts);

    // Detect tab switch or minimize
    const handleVisibilityChange = () => {
      if (document.hidden && !examSubmitted) {
        logEvent("TAB_SWITCH");
        setWarningCount(prev => prev + 1);
        toast({
          title: "Security Alert",
          description: "Tab Switching Detected — Logged",
          variant: "destructive"
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Disable copy, paste, cut
    const disableCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast({
          title: "Security Alert",
          description: "Copy-Paste disabled!",
          variant: "destructive"
        });
    };
    document.addEventListener("copy", disableCopyPaste);
    document.addEventListener("paste", disableCopyPaste);
    document.addEventListener("cut", disableCopyPaste);

    // Optional: warn on leaving the page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Exam in progress — leaving will end the session!";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
      document.removeEventListener("keydown", disableShortcuts);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", disableCopyPaste);
      document.removeEventListener("paste", disableCopyPaste);
      document.removeEventListener("cut", disableCopyPaste);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!examSubmitted && shortcutCount >= 15) {
      alert("Too many shortcut attempts detected! Your exam will be auto-submitted.");
      handleAutoSubmit();
    }
  }, [shortcutCount, examSubmitted]);


  useEffect(() => {
    if (warningCount >= 3 && !examSubmitted) {
      alert("Multiple focus changes detected! Your exam will be auto-submitted.");
      handleAutoSubmit();  // uses submitToServer + reason (see note below)
    }
  }, [warningCount, examSubmitted]);


  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0 || examSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, examSubmitted]);


  // Security monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !examSubmitted) {
        toast({
          title: "Security Warning",
          description: "Tab switching detected. This has been logged.",
          variant: "destructive",
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
        e.preventDefault();
        toast({
          title: "Action Blocked",
          description: "Copy/paste operations are not allowed during the exam.",
          variant: "destructive",
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [examSubmitted, toast]);

  // Save answer (uses sessionId and backend expected fields)
  const handleAnswerChange = async (questionId: string, selectedValue: string) => {
    // Store the OPTION TEXT
    setAnswers((prev) => ({ ...prev, [questionId]: selectedValue }));

    if (!sessionId) return;

    try {
      await fetch(`${API_BASE}/api/student/exams/${examId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          questionId,
          selectedOption: selectedValue, // save text
        }),
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };



  const logEvent = async (eventType: string) => {
    if (!sessionId) {
      console.warn("No sessionId for event; skipping log");
      return;
    }
    try {
      await fetch(`${API_BASE}/api/student/exams/${examId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId, eventType }),
      });
    } catch (err) {
      console.error("Event log failed", err);
    }
  };

  const handleQuestionFlag = (questionId: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  

  const handleAutoSubmit = async () => {
    if (!sessionId) {
      setExamSubmitted(true);
      navigate("/student/exam/result");
      return;
    }

    try {
      await submitToServer();   // ✅ call backend
      setExamSubmitted(true);
      toast({
        title: "Exam Auto-Submitted",
        description: "Time limit reached. Your exam has been automatically submitted.",
        variant: "destructive",
      });
      setTimeout(() => {
        navigate(`/student/exam/result/${examId}`);
      }, 2000);
    } catch (err) {
      console.error("Auto submit failed", err);
      toast({
        title: "Auto-submit failed",
        description: "Please contact your instructor.",
        variant: "destructive",
      });
    }
  };

  
  


  useEffect(() => {
    const tabId = Math.random().toString(36).substr(2, 9);
    localStorage.setItem("examTab", tabId);
    const checkTab = setInterval(() => {
      if (localStorage.getItem("examTab") !== tabId) {
        alert("Multiple tabs detected! Closing...");
        window.close();
      }
    }, 1000);
    return () => clearInterval(checkTab);
  }, []);

  const submitToServer = async () => {
    if (!sessionId) {
      console.warn("No sessionId for submit; aborting");
      return;
    }
    await fetch(`${API_BASE}/api/student/exams/${examId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId }),
    });
  };



  const handleManualSubmit = async () => {
    if (!examData || !examData.questions) return;

    const unanswered = examData.questions.filter((q) => !answers[q._id]);

    if (unanswered.length > 0) {
      toast({
        title: "Incomplete Exam",
        description: `${unanswered.length} question(s) are not answered.`,
        variant: "destructive",
      });
      return;
    }

    await submitToServer();
    setExamSubmitted(true);
    toast({
      title: "Exam Submitted Successfully",
      description: "Your answers have been saved and submitted for evaluation.",
    });

    setTimeout(() => {
      navigate(`/student/exam/result/${examId}`);
    }, 2000);
  };



  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="p-8 text-center">Preparing exam...</div>;
  if (loadError) return <div className="p-8 text-center text-danger">Error: {loadError}</div>;
  if (!examData || !Array.isArray(examData.questions) || examData.questions.length === 0) {
    return <div className="p-8 text-center">No questions available for this exam.</div>;
  }


  const clampedIndex = Math.max(0, Math.min(currentQuestion, examData.questions.length - 1));
  const currentQ = examData.questions[clampedIndex];
  const progress = ((clampedIndex + 1) / examData.questions.length) * 100;

  if (examSubmitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="shadow-elevated max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Exam Submitted</h2>
            <p className="text-muted-foreground mb-6">
              Your answers have been successfully submitted and saved securely.
            </p>
            <Button onClick={() => navigate("/student/dashboard")} variant="hero">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen bg-muted/30">
      {/* Security Header */}
      <header className="bg-card shadow-card border-b border-warning">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="h-6 w-6 text-warning" />
              <div>
                <h1 className="font-bold text-card-foreground">{examData.title}</h1>
                <p className="text-sm text-muted-foreground">Secure Exam Mode Active</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Time Remaining</p>
                <p
                  className={`text-lg font-bold ${
                    timeRemaining < 600 ? "text-danger" : "text-card-foreground"
                  }`}
                >
                  {formatTime(timeRemaining)}
                </p>
                {lastSaved && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Auto-saved at {lastSaved.toLocaleTimeString()}
                  </p>
                )}
              </div>

              <Button variant="destructive" onClick={handleManualSubmit}>
                Submit Exam
              </Button>
            </div>

          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress Bar */}
        <Card className="shadow-card mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">
                Question {currentQuestion + 1} of {examData.questions.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{currentQ?.type ? currentQ.type.toUpperCase() : "MCQ"}</Badge>

                    {/* ✅ Difficulty Tag */}
                    <Badge 
                      className={
                        (currentQ?.mode || "medium") === "easy"
                          ? "bg-green-100 text-green-700"
                          : (currentQ?.mode || "medium") === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {(currentQ?.mode || "medium").toUpperCase()}
                    </Badge>

                    Question {currentQuestion + 1}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuestionFlag(currentQ._id)}
                    className={flaggedQuestions.has(currentQ._id) ? "text-warning" : ""}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              
              <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  <p className="text-card-foreground leading-relaxed">{currentQ.question}</p>
                </div>

                {/* MCQ Options */}
                
                {currentQ.options && (
                  <RadioGroup
                    value={answers[currentQ._id] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQ._id, value)}
                  >
                    {currentQ.options.map((option: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50"
                      >
                        <RadioGroupItem
                          value={option} // ✅ use text
                          id={`option-${currentQ._id}-${index}`}
                        />
                        <Label
                          htmlFor={`option-${currentQ._id}-${index}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}


                {/* Descriptive Answer */}
                
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                variant="outline" 
                onClick={() => setCurrentQuestion(prev => Math.min(examData.questions.length - 1, prev + 1))}
                disabled={currentQuestion === examData.questions.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {examData.questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentQuestion === index ? "default" : "outline"}
                      size="sm"
                      className={`relative ${
                        answers[examData.questions[index]._id] ? "bg-green-500" : ""
                      } ${
                        flaggedQuestions.has(examData.questions[index]._id) ? "border-warning" : ""
                      }`}
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                      {flaggedQuestions.has(examData.questions[index]._id) && (
                        <Flag className="h-3 w-3 absolute -top-1 -right-1 text-warning" />
                      )}
                    </Button>
                  ))}
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-success-light rounded border"></div>
                    <span className="text-muted-foreground">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border rounded"></div>
                    <span className="text-muted-foreground">Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-warning" />
                    <span className="text-muted-foreground">Flagged</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="shadow-card mt-4 border-warning">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-card-foreground mb-1">Security Active</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Tab switching, copy/paste, and other suspicious activities are monitored and logged.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {showReenter && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="text-center">
            <p className="text-white text-lg font-semibold mb-4">
              Fullscreen mode is required to continue the exam
            </p>
            <Button onClick={handleReEnterFullscreen} variant="destructive">
              Re-Enter Fullscreen
            </Button>
          </div>
        </div>
      )}

    </div>
    
  );
};

export default ExamInterface;