import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/uir/card";
import { Badge } from "@/components/uir/badge";
import { Button } from "@/components/uir/button";
import { Progress } from "@/components/uir/progress";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Award,
  FileText,
  Code,
  User,
  Calendar,
  Trash2,
  Download,
  Flag,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/uir/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/uir/collapsible";
import { ScrollArea } from "@/components/uir/scroll-area";
import { Separator } from "@/components/uir/separator";

// Types based on backend models
interface TestCaseResult {
  inputs: string[];
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

interface QuestionSubmission {
  questionId: string;
  title: string;
  shortDescription: string;
  longDescription?: string;
  language: string;
  code: string | null; // null if deleted after 30 days
  results: TestCaseResult[] | null; // null if deleted after 30 days
  score: number;
  maxScore: number;
  status: "passed" | "failed" | "partial";
  attempts: number;
  autoSubmitted: boolean;
  violationDetected: boolean;
  submittedAt: string;
  isDeleted: boolean; // true if data expired (30 days)
}

interface StudentDetails {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  department: string;
  year: string;
  collegeName: string;
  profileImage?: string;
}

interface ExamDetails {
  id: string;
  title: string;
  language: string;
  duration: number;
  totalMarks: number;
  questionCount: number;
  perQuestionMark: number;
  generateCertificate: boolean;
  startTime: string;
  endTime: string;
}

interface ExamAttemptStats {
  totalQuestions: number;
  attempted: number;
  passed: number;
  partial: number;
  failed: number;
}

interface CompilerExamResultData {
  student: StudentDetails;
  exam: ExamDetails;
  totalScore: number;
  maxScore: number;
  percentage: number;
  pass: boolean;
  reason: "manual" | "timeout" | "violation";
  startedAt: string;
  submittedAt: string;
  stats: ExamAttemptStats;
  certificateEligible: boolean;
  certificateId?: string;
  submissions: QuestionSubmission[];
  reviewCompleted: boolean;
}

// Dummy data for development
const dummyResultData: CompilerExamResultData = {
  student: {
    id: "student_001",
    name: "John Doe",
    rollNumber: "CS2024001",
    email: "john.doe@college.edu",
    department: "Computer Science",
    year: "3rd Year",
    collegeName: "ABC Engineering College",
    profileImage: "",
  },
  exam: {
    id: "exam_001",
    title: "Data Structures & Algorithms - Midterm",
    language: "python",
    duration: 120,
    totalMarks: 100,
    questionCount: 3,
    perQuestionMark: 33.33,
    generateCertificate: true,
    startTime: "2024-01-15T10:00:00Z",
    endTime: "2024-01-15T12:00:00Z",
  },
  totalScore: 83.33,
  maxScore: 100,
  percentage: 83.33,
  pass: true,
  reason: "manual",
  startedAt: "2024-01-15T10:02:15Z",
  submittedAt: "2024-01-15T11:45:30Z",
  stats: {
    totalQuestions: 3,
    attempted: 3,
    passed: 2,
    partial: 1,
    failed: 0,
  },
  certificateEligible: true,
  certificateId: "CERT-DSA-2024-001",
  reviewCompleted: false,
  submissions: [
    {
      questionId: "q_001",
      title: "Two Sum Problem",
      shortDescription: "Find two numbers that add up to target",
      longDescription:
        "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      language: "python",
      code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test
nums = [2, 7, 11, 15]
target = 9
print(two_sum(nums, target))`,
      results: [
        {
          inputs: ["[2, 7, 11, 15]", "9"],
          expectedOutput: "[0, 1]",
          actualOutput: "[0, 1]",
          passed: true,
        },
        {
          inputs: ["[3, 2, 4]", "6"],
          expectedOutput: "[1, 2]",
          actualOutput: "[1, 2]",
          passed: true,
        },
        {
          inputs: ["[3, 3]", "6"],
          expectedOutput: "[0, 1]",
          actualOutput: "[0, 1]",
          passed: true,
        },
      ],
      score: 33.33,
      maxScore: 33.33,
      status: "passed",
      attempts: 2,
      autoSubmitted: false,
      violationDetected: false,
      submittedAt: "2024-01-15T10:45:00Z",
      isDeleted: false,
    },
    {
      questionId: "q_002",
      title: "Reverse Linked List",
      shortDescription: "Reverse a singly linked list",
      longDescription:
        "Given the head of a singly linked list, reverse the list, and return the reversed list.",
      language: "python",
      code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    prev = None
    current = head
    while current:
        next_temp = current.next
        current.next = prev
        prev = current
        current = next_temp
    return prev`,
      results: [
        {
          inputs: ["[1, 2, 3, 4, 5]"],
          expectedOutput: "[5, 4, 3, 2, 1]",
          actualOutput: "[5, 4, 3, 2, 1]",
          passed: true,
        },
        {
          inputs: ["[1, 2]"],
          expectedOutput: "[2, 1]",
          actualOutput: "[2, 1]",
          passed: true,
        },
        {
          inputs: ["[]"],
          expectedOutput: "[]",
          actualOutput: "[]",
          passed: true,
        },
      ],
      score: 33.33,
      maxScore: 33.33,
      status: "passed",
      attempts: 1,
      autoSubmitted: false,
      violationDetected: false,
      submittedAt: "2024-01-15T11:15:00Z",
      isDeleted: false,
    },
    {
      questionId: "q_003",
      title: "Binary Search Tree Validation",
      shortDescription: "Check if a binary tree is a valid BST",
      longDescription:
        "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
      language: "python",
      code: null, // Deleted after 30 days
      results: null, // Deleted after 30 days
      score: 16.67,
      maxScore: 33.33,
      status: "partial",
      attempts: 3,
      autoSubmitted: true,
      violationDetected: false,
      submittedAt: "2024-01-15T11:40:00Z",
      isDeleted: true,
    },
  ],
};

const CompilerExamStudentResult = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<CompilerExamResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    new Set()
  );

  

  useEffect(() => {
    // Force light mode for this page
    document.documentElement.classList.remove("dark");

    // Simulate API call with dummy data
    const fetchData = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      // In production, replace with actual API call:
      // const res = await fetch(`${API_BASE}/api/student/compiler-exams/${examId}/result`, { credentials: "include" });
      // const json = await res.json();
      setData(dummyResultData);
      setLoading(false);
    };

    fetchData();
  }, [examId]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusBadge = (status: "passed" | "failed" | "partial") => {
    switch (status) {
      case "passed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Passed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "partial":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
    }
  };

  const handleDownloadCertificate = () => {
    if (data?.certificateId) {
      navigate(`/student/certificate/${data.certificateId}`);
    }
  };

  const handleReport = () => {
    // Navigate to report page or open report modal
    console.log("Report issue for exam:", examId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading result...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Result Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The exam result you're looking for doesn't exist or has been
              removed.
            </p>
            <Button onClick={() => navigate("/student/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, exam, stats, submissions } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header Section - Student & Exam Details with Score */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div
            className={`h-2 ${data.pass ? "bg-green-500" : "bg-destructive"}`}
          />
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Left: Student & Exam Info */}
              <div className="flex-1 space-y-4">
                {/* Exam Title */}
                <div>
                  <h1 className="text-2xl font-bold  text-foreground mb-1">
                    {exam.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="font-mono">
                      {exam.language.toUpperCase()}
                    </Badge>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exam.duration} mins
                    </span>
                    <span>•</span>
                    <span>{exam.questionCount} Questions</span>
                  </div>
                </div>

                {/* Student Info */}
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Roll No:</span>{" "}
                      <span className="font-medium">{student.rollNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Department:</span>{" "}
                      <span className="font-medium">{student.department}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Year:</span>{" "}
                      <span className="font-medium">{student.year}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground">College:</span>{" "}
                      <span className="font-medium">{student.collegeName}</span>
                    </div>
                  </div>
                </div>

                {/* Submission Info */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Started: {formatDate(data.startedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Submitted: {formatDate(data.submittedAt)}
                  </span>
                  {data.reason !== "manual" && (
                    <Badge
                      variant="outline"
                      className="text-amber-600 border-amber-300"
                    >
                      {data.reason === "timeout"
                        ? "Auto-submitted (Timeout)"
                        : "Violation Detected"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Right: Score Card */}
              <div className="lg:w-72 space-y-4">
                <div
                  className={`p-6 rounded-xl text-center ${
                    data.pass
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <Badge
                    className={`mb-3 text-lg px-4 py-1 ${
                      data.pass
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-destructive hover:bg-destructive/90"
                    }`}
                  >
                    {data.pass ? "PASSED" : "FAILED"}
                  </Badge>
                  <div className="text-4xl font-bold text-foreground mb-1">
                    {data.totalScore.toFixed(2)}
                    <span className="text-lg text-muted-foreground">
                      /{data.maxScore}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-primary">
                    {data.percentage.toFixed(1)}%
                  </div>
                  <Progress value={data.percentage} className="mt-3 h-2" />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {stats.passed}
                    </div>
                    <div className="text-xs text-muted-foreground">Passed</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-amber-600">
                      {stats.partial}
                    </div>
                    <div className="text-xs text-muted-foreground">Partial</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-destructive">
                      {stats.failed}
                    </div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-muted-foreground">
                      {stats.totalQuestions - stats.attempted}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Unattempted
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Code className="w-5 h-5" />
            Question Submissions
          </h2>

          {submissions.map((submission, index) => (
            <Card
              key={submission.questionId}
              className="border shadow-sm overflow-hidden"
            >
              <Collapsible
                open={expandedQuestions.has(submission.questionId)}
                onOpenChange={() => toggleQuestion(submission.questionId)}
              >
                {/* Question Header */}
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Q{index + 1}
                          </span>
                          <CardTitle className="text-lg">
                            {submission.title}
                          </CardTitle>
                          {submission.isDeleted && (
                            <Badge
                              variant="outline"
                              className="text-amber-600 border-amber-300"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Data Expired
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {submission.shortDescription}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {submission.score.toFixed(2)}
                            <span className="text-sm text-muted-foreground">
                              /{submission.maxScore.toFixed(2)}
                            </span>
                          </div>
                          {getStatusBadge(submission.status)}
                        </div>
                        {expandedQuestions.has(submission.questionId) ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <Separator />

                    {/* Submission Meta */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>
                        Language:{" "}
                        <Badge variant="outline" className="font-mono ml-1">
                          {submission.language.toUpperCase()}
                        </Badge>
                      </span>
                      <span>Attempts: {submission.attempts}</span>
                      <span>Submitted: {formatDate(submission.submittedAt)}</span>
                      {submission.autoSubmitted && (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-300"
                        >
                          Auto-submitted
                        </Badge>
                      )}
                      {submission.violationDetected && (
                        <Badge variant="destructive">Violation Detected</Badge>
                      )}
                    </div>

                    {/* Deleted Data Notice */}
                    {submission.isDeleted ? (
                      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
                        <Trash2 className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                        <h3 className="font-semibold text-amber-800 mb-1">
                          Submission Data Expired
                        </h3>
                        <p className="text-sm text-amber-700">
                          Code and test case results have been automatically
                          deleted after 30 days to save storage. Only the score
                          is preserved.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Code Section */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Submitted Code
                          </h4>
                          <ScrollArea className="h-64 rounded-lg border bg-slate-900">
                            <pre className="p-4 text-sm text-slate-100 font-mono whitespace-pre-wrap">
                              {submission.code}
                            </pre>
                          </ScrollArea>
                        </div>

                        {/* Test Cases Results Table */}
                        {submission.results && submission.results.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-foreground">
                              Test Case Results
                            </h4>
                            <div className="rounded-lg border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead className="w-16">S.No</TableHead>
                                    <TableHead>Input</TableHead>
                                    <TableHead>Expected Output</TableHead>
                                    <TableHead>Actual Output</TableHead>
                                    <TableHead className="w-24 text-center">
                                      Status
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {submission.results.map((result, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium">
                                        {idx + 1}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {result.inputs.join(", ")}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {result.expectedOutput}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {result.actualOutput}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {result.passed ? (
                                          <Badge className="bg-green-500 hover:bg-green-600">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Pass
                                          </Badge>
                                        ) : (
                                          <Badge variant="destructive">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Fail
                                          </Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {/* Footer Actions */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: Back to Dashboard */}
              <Button
                variant="outline"
                onClick={() => navigate("/student/dashboard")}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              {/* Right: Report & Certificate */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleReport}
                  className="flex-1 sm:flex-none"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
                {data.pass && data.certificateEligible && (
                  <Button
                    onClick={handleDownloadCertificate}
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    <Download className="w-4 h-4 mr-1" />
                    Certificate
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompilerExamStudentResult;
