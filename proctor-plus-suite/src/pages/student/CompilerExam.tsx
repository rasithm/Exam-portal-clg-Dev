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


// Mock exam data
const mockExam = {
  title: "Data Structures Final Exam",
  duration: 120,
  languages: ["Python", "Java", "C++", "JavaScript"],
  questions: [
    {
      id: 1,
      title: "Two Sum",
      difficulty: "Easy" as const,
      evaluationMode: "Strict" as const,
      shortDescription: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      longDescription: `You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.`,
      inputFormat: "First line: n (number of elements)\nSecond line: n space-separated integers\nThird line: target sum",
      outputFormat: "Two space-separated indices (0-indexed)",
      testCases: [
        { inputs: ["4", "2 7 11 15", "9"], expectedOutput: "0 1", isHidden: false },
        { inputs: ["3", "3 2 4", "6"], expectedOutput: "1 2", isHidden: false },
        { inputs: ["2", "3 3", "6"], expectedOutput: "0 1", isHidden: true },
      ],
      attemptLimit: 5,
      completed: false,
    },
    {
      id: 2,
      title: "Reverse Linked List",
      difficulty: "Medium" as const,
      evaluationMode: "Strict" as const,
      shortDescription: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
      longDescription: `The linked list is given as space-separated values representing the nodes.

**Constraints:**
- The number of nodes in the list is in the range [0, 5000]
- -5000 <= Node.val <= 5000`,
      inputFormat: "Space-separated integers representing node values",
      outputFormat: "Space-separated integers representing reversed list",
      testCases: [
        { inputs: ["1 2 3 4 5"], expectedOutput: "5 4 3 2 1", isHidden: false },
        { inputs: ["1 2"], expectedOutput: "2 1", isHidden: false },
        { inputs: [""], expectedOutput: "", isHidden: true },
      ],
      attemptLimit: 5,
      completed: false,
    },
    {
      id: 3,
      title: "Valid Parentheses",
      difficulty: "Easy" as const,
      evaluationMode: "Strict" as const,
      shortDescription: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      longDescription: `An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
      inputFormat: "A string containing parentheses",
      outputFormat: "true or false",
      testCases: [
        { inputs: ["()"], expectedOutput: "true", isHidden: false },
        { inputs: ["()[]{}"], expectedOutput: "true", isHidden: false },
        { inputs: ["(]"], expectedOutput: "false", isHidden: true },
      ],
      attemptLimit: 5,
      completed: true,
    },
  ],
};

export default function CompilerExam() {
  const navigate = useNavigate();
  const [examStarted, setExamStarted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(mockExam.duration * 60);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState<Record<number, number>>({});
  const [editorTheme, setEditorTheme] = useState<EditorTheme>("vs-dark");
  const [runningTestCaseIndex, setRunningTestCaseIndex] = useState<number | undefined>(undefined);
  const [testCaseResults, setTestCaseResults] = useState<Record<number, Record<number, { status: "passed" | "failed"; actualOutput: string }>>>({});
  const [showSubmitResultModal, setShowSubmitResultModal] = useState(false);
  const { isFullscreen, tabSwitchCount, enterFullscreen, exitFullscreen } = useExamSecurity(examStarted);

  // const currentQuestion = mockExam.questions[currentQuestionIndex];
  const [questions, setQuestions] = useState(
    mockExam.questions.map(q => ({ ...q, completed: false }))
  );

  const currentQuestion = questions[currentQuestionIndex];
  

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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartExam = async () => {
    await enterFullscreen();
    setExamStarted(true);
  };

  const handleRun = (code: string, language: string, customInput?: string) => {
    setIsRunning(true);
    setOutput("Running all test cases...\n");
    
    // Simulate code execution
    setTimeout(() => {
      const visibleTestCases = currentQuestion.testCases.filter(tc => !tc.isHidden);
      const statuses: { index: number; status: "passed" | "failed" }[] = [];
      const results: Record<number, { status: "passed" | "failed"; actualOutput: string }> = {};
      const allTableResults: typeof tableResults = [];
      
      let outputText = "";
      
      if (customInput) {
        outputText = `=== Running ${language} with Custom Input ===\n\nInput:\n${customInput}\n\nOutput:\n[Simulated output for custom input]\n`;
        setShowResultsTable(false);
      } else {
        outputText = `=== Running ${language} - All Test Cases ===\n\n`;
        
        visibleTestCases.forEach((tc, i) => {
          const passed = Math.random() > 0.3;
          const actualOutput = passed ? tc.expectedOutput : "Wrong output";
          
          results[i] = { status: passed ? "passed" : "failed", actualOutput };
          statuses.push({ index: i, status: passed ? "passed" : "failed" });
          
          // Add to table results
          allTableResults.push({
            sno: i + 1,
            name: `Test Case ${i + 1}`,
            input: tc.inputs.join(", "),
            expectedOutput: tc.expectedOutput,
            actualOutput,
            status: passed ? "passed" : "failed",
          });
          
          outputText += `Test Case ${i + 1}: ${passed ? "✓ Passed" : "✗ Failed"}\n`;
        });
        
        outputText += `\n--- Summary ---\n`;
        outputText += `Passed: ${statuses.filter(s => s.status === "passed").length}/${visibleTestCases.length}\n`;
        
        // Show table results for all test cases
        setTableResults(allTableResults);
        setShowResultsTable(true);
      }
      
      setOutput(outputText);
      setTestCaseStatuses(statuses);
      setTestCaseResults(prev => ({
        ...prev,
        [currentQuestion.id]: results,
      }));
      setIsRunning(false);
    }, 1500);
  };

  // Run a single test case
  const handleRunTestCase = (testCaseIndex: number) => {
    setRunningTestCaseIndex(testCaseIndex);
    setShowResultsTable(false);
    
    setTimeout(() => {
      const passed = Math.random() > 0.3;
      const testCase = currentQuestion.testCases.filter((tc) => !tc.isHidden)[testCaseIndex];
      const actualOutput = passed ? testCase.expectedOutput : "Wrong output";
      
      // Update test case results
      setTestCaseResults((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          [testCaseIndex]: {
            status: passed ? "passed" : "failed",
            actualOutput,
          },
        },
      }));
      
      // Create table result
      const tableResult = {
        sno: testCaseIndex + 1,
        name: `Test Case ${testCaseIndex + 1}`,
        input: testCase?.inputs.join(", ") || "",
        expectedOutput: testCase?.expectedOutput || "",
        actualOutput,
        status: (passed ? "passed" : "failed") as "pending" | "passed" | "failed",
      };
      
      setTableResults([tableResult]);
      setShowResultsTable(true);
      
      setOutput(`=== Test Case ${testCaseIndex + 1} ===\n\nInput:\n${testCase?.inputs.join("\n")}\n\nExpected: ${testCase?.expectedOutput}\nActual: ${actualOutput}\n\n${passed ? "✓ Passed" : "✗ Failed"}`);
      setRunningTestCaseIndex(undefined);
    }, 1000);
  };

  const handleSubmit = (code: string, language: string) => {
    const questionId = currentQuestion.id;
    const currentAttempts = attemptsUsed[questionId] || 0;

    if (currentAttempts >= currentQuestion.attemptLimit) {
      toast({
        title: "Attempt limit reached",
        description: "You have used all attempts for this question.",
        variant: "destructive",
      });
      return;
    }

    setAttemptsUsed(prev => ({ ...prev, [questionId]: currentAttempts + 1 }));
    setIsRunning(true);

    setTimeout(() => {
      const passed = Math.random() > 0.3;

      if (passed) {
        toast({ title: "Question submitted successfully" });

        setQuestions(prev =>
          prev.map((q, i) =>
            i === currentQuestionIndex ? { ...q, completed: true } : q
          )
        );

        // move to next question automatically
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(i => i + 1);
        }
      } else {
        toast({
          title: "Some test cases failed",
          description: "Fix your code and try again.",
          variant: "destructive",
        });
      }

      setIsRunning(false);
    }, 1500);
  };


  const handleFinalSubmit = () => {
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
        examTitle={mockExam.title}
        duration={mockExam.duration}
        questionCount={mockExam.questions.length}
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
              <h1 className="font-semibold text-sm">{mockExam.title}</h1>
              <p className="text-xs text-muted-foreground">
                Question {currentQuestionIndex + 1} of {mockExam.questions.length}
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
              examTitle={mockExam.title}
              questionTitle={currentQuestion.title}
              difficulty={currentQuestion.difficulty}
              evaluationMode={currentQuestion.evaluationMode}
              shortDescription={currentQuestion.shortDescription}
              longDescription={currentQuestion.longDescription}
              inputFormat={currentQuestion.inputFormat}
              outputFormat={currentQuestion.outputFormat}
              testCases={currentQuestion.testCases.filter((tc) => !tc.isHidden).map((tc, i) => {
                const result = testCaseResults[currentQuestion.id]?.[i];
                return {
                  ...tc,
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
              languages={mockExam.languages}
              onRun={handleRun}
              onSubmit={handleSubmit}
              isRunning={isRunning}
              output={output}
              editorTheme={editorTheme}
              testCaseStatuses={testCaseStatuses}
            />
          </div>

          {/* Question Navigator - Fixed at bottom */}
          <div className="border-t border-border p-4 bg-muted/30 flex-shrink-0">
            <QuestionNavigator
              questions={mockExam.questions.map((q) => ({
                id: q.id,
                title: q.title,
                completed: q.completed,
                current: q.id === currentQuestion.id,
              }))}
              currentIndex={currentQuestionIndex}
              onNavigate={setCurrentQuestionIndex}
              onPrevious={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              onNext={() =>
                setCurrentQuestionIndex((i) => Math.min(mockExam.questions.length - 1, i + 1))
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
