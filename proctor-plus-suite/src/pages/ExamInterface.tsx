import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Exam state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(7200); // 2 hours in seconds
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Sample exam data
  const [examData] = useState({
    title: "Data Structures Final Examination",
    duration: 120,
    totalQuestions: 25,
    questions: [
      {
        id: 1,
        type: "mcq",
        question: "What is the time complexity of searching in a balanced binary search tree?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        correctAnswer: 1
      },
      {
        id: 2,
        type: "mcq", 
        question: "Which data structure follows the LIFO (Last In First Out) principle?",
        options: ["Queue", "Stack", "Array", "Linked List"],
        correctAnswer: 1
      },
      {
        id: 3,
        type: "descriptive",
        question: "Explain the difference between DFS and BFS traversal algorithms. Provide examples of when each would be preferred.",
        maxWords: 200
      },
      {
        id: 4,
        type: "coding",
        question: "Write a function to reverse a linked list. Provide both iterative and recursive solutions.",
        language: "javascript"
      }
    ]
  });

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

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
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

  const handleAutoSubmit = () => {
    setExamSubmitted(true);
    toast({
      title: "Exam Auto-Submitted",
      description: "Time limit reached. Your exam has been automatically submitted.",
      variant: "destructive",
    });
    
    setTimeout(() => {
      navigate("/student/dashboard");
    }, 3000);
  };

  const handleManualSubmit = () => {
    setExamSubmitted(true);
    toast({
      title: "Exam Submitted Successfully",
      description: "Your answers have been saved and submitted for evaluation.",
    });
    
    setTimeout(() => {
      navigate("/student/dashboard");
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = examData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / examData.questions.length) * 100;

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
                <p className={`text-lg font-bold ${timeRemaining < 600 ? 'text-danger' : 'text-card-foreground'}`}>
                  {formatTime(timeRemaining)}
                </p>
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
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline">
                      {currentQ.type.toUpperCase()}
                    </Badge>
                    Question {currentQuestion + 1}
                  </CardTitle>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuestionFlag(currentQ.id)}
                    className={flaggedQuestions.has(currentQ.id) ? "text-warning" : ""}
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
                {currentQ.type === "mcq" && currentQ.options && (
                  <RadioGroup
                    value={answers[currentQ.id] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
                  >
                    {currentQ.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Descriptive Answer */}
                {currentQ.type === "descriptive" && (
                  <div className="space-y-2">
                    <Label htmlFor="descriptive-answer">Your Answer</Label>
                    <Textarea
                      id="descriptive-answer"
                      placeholder="Type your detailed answer here..."
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      className="min-h-[200px]"
                    />
                    {currentQ.maxWords && (
                      <p className="text-sm text-muted-foreground">
                        Maximum {currentQ.maxWords} words
                      </p>
                    )}
                  </div>
                )}

                {/* Coding Question */}
                {currentQ.type === "coding" && (
                  <div className="space-y-2">
                    <Label htmlFor="code-answer">Your Code</Label>
                    <Textarea
                      id="code-answer"
                      placeholder="Write your code here..."
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      Language: {currentQ.language}
                    </p>
                  </div>
                )}
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
                        answers[examData.questions[index].id] ? "bg-success-light" : ""
                      } ${
                        flaggedQuestions.has(examData.questions[index].id) ? "border-warning" : ""
                      }`}
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                      {flaggedQuestions.has(examData.questions[index].id) && (
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
    </div>
  );
};

export default ExamInterface;