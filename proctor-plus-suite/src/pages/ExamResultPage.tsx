// src/pages/ExamResultPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle } from "lucide-react";
import { baseUrl } from "../constant/Url";
const API_BASE = baseUrl || "http://localhost:5000";
import { useToast } from "@/hooks/use-toast";

const ExamResultPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  


  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/student/exams/${examId}/result`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        setData(null);
      } else {
        setData(json);
      }
      setLoading(false);
    })();
  }, [examId]);

  // src/pages/ExamResultPage.tsx

  const handleCompleteReview = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/exams/${examId}/clear-review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to clear review data");
      }

      toast({
        title: "Result Verified",
        description:
          "Your answers have been verified. Detailed review data is cleared and only marks are stored.",
      });

      // ✅ Go to exam completed / certificate page
      if (data.pass && data.certificateId) {
        navigate(`/exam/completed/${data.certificateId}`, {
          state: { from: "student", examId },   // ✅ to detect student view later
        });
      } else {
        navigate("/student/dashboard");
      }
      // or your actual completed route
    } catch (err) {
      console.error("Clear review failed", err);
      toast({
        title: "Failed to complete review",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };


  
  if (loading) return <div className="p-8 text-center">Loading result...</div>;
  if (!data) return <div className="p-8 text-center">Result not found.</div>;
  const stats = data && data.stats ? data.stats : {};

  if (data.reviewCompleted && (!data.questions || data.questions.length === 0)) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="mb-6 shadow-card">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>{data.examName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Score: {data.totalMarks.toFixed(2)} • {data.percentage.toFixed(2)}%
                </p>
              </div>
              <div className="text-right">
                <Badge variant={data.pass ? "success" : "destructive"}>
                  {data.pass ? "Passed" : "Failed"}
                </Badge>
                <Progress className="mt-2 h-2" value={data.percentage} />
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Detailed review has been cleared to save storage.
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
            <Button variant="outline" onClick={() => navigate("/student/dashboard")}>
              Back to Dashboard
            </Button>

            {data.pass && data.certificateEligible && (
              <Button
                variant="hero"
                onClick={() => navigate(`/exam/completed/${data.certificateId}`)}
              >
                View Certificate
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-6 shadow-card">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>{data.examName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Score: {data.totalMarks.toFixed(2)} / {data.maxMarks.toFixed(2)} •{" "}
                {data.percentage.toFixed(2)}%
              </p>
              {data.stats && (
                <p className="text-xs text-muted-foreground mt-1">
                  Qns: {stats.totalQuestions} • Attempted: {stats.attempted} • Correct: {stats.correct} • Wrong: {stats.wrong} • Grace: {stats.graceCount || 0}
                </p>
              )}
              {data.stats && (
                <p className="text-xs text-muted-foreground mt-1">
                  Easy: {stats.easyCorrect || 0} ({(stats.easyMarks || 0).toFixed(1)} marks) •
                  Medium: {stats.mediumCorrect || 0} ({(stats.mediumMarks || 0).toFixed(1)} marks) •
                  Hard: {stats.hardCorrect || 0} ({(stats.hardMarks || 0).toFixed(1)} marks)
                </p>
              )}
            </div>
            <div className="text-right">
              <Badge variant={data.pass ? "success" : "destructive"}>
                {data.pass ? "Passed" : "Failed"}
              </Badge>
              <Progress className="mt-2 h-2" value={data.percentage} />
            </div>
          </CardHeader>

        </Card>

        <div className="space-y-4">
          {data.questions.map((q: any, idx: number) => {
            const correctIdx = q.correctAnswer;
            const correctText =
              Array.isArray(q.options) &&
              correctIdx != null &&
              correctIdx >= 0 &&
              correctIdx < q.options.length
                ? q.options[correctIdx]
                : q.correctAnswerText || null;

            const selectedText = q.selectedOption || null;
            const isGrace = q.isGrace;


            return (
                <Card key={q.id} className="shadow-card">
                <CardHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                    <Badge variant="outline">Q{idx + 1}</Badge>
                    <Badge
                        className={
                        q.mode === "easy"
                            ? "bg-green-100 text-green-700"
                            : q.mode === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                    >
                        {q.mode.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Marks: {q.marks}</span>
                    </div>
                    {isGrace ? (
                      <span className="text-xs font-semibold text-blue-600">
                        Grace Marks Awarded
                      </span>
                    ) : q.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="font-medium text-card-foreground">{q.question}</p>
                    <div className="space-y-2">
                    {q.options.map((opt: string, i: number) => {
                        const isCorrect = correctText && opt === correctText;
                        const isSelected = selectedText && opt === selectedText;

                        return (
                        <div
                            key={i}
                            className={`
                            rounded-lg px-3 py-2 text-sm border
                            ${isCorrect ? "bg-green-100 border-green-400" : ""}
                            ${isSelected && !isCorrect ? "bg-red-100 border-red-400" : ""}
                            `}
                        >
                            <span>{opt}</span>
                            {isCorrect && (
                            <span className="ml-2 text-xs font-semibold text-green-700">
                                (Correct)
                            </span>
                            )}
                            {isSelected && (
                            <span className="ml-2 text-xs text-blue-700">(Your choice)</span>
                            )}
                        </div>
                        );
                    })}
                    </div>
                    {isGrace && (
                      <p className="text-xs text-blue-600 font-medium mt-2">
                        This question had configuration issues. Full marks have been given as grace.
                      </p>
                    )}
                </CardContent>
                </Card>
            );
            })}

        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            {/* <Button variant="outline" onClick={() => navigate("/student/dashboard")}>
                Back to Dashboard
            </Button> */}

            {(data.pass || !data.pass )&& (
              <Button variant="hero" onClick={handleCompleteReview}>
                Verify Result & Complete
              </Button>
            )}

        </div>

      </div>
    </div>
  );
};

export default ExamResultPage;
