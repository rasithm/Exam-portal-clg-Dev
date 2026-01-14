// src/pages/CompilerResultPage.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Code2,
  Terminal,
  User,
  GraduationCap,
  Download,
  LayoutDashboard,
  Flag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { baseUrl } from "../constant/Url";

const API_BASE = baseUrl || "http://localhost:5000";

const CompilerResultPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/api/student/compiler-exams/${examId}/result`,
          {
            credentials: "include",
          }
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || "Failed to load result");
        }
        setData(json);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Could not fetch exam results.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [examId, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating comprehensive report...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Result data unavailable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* --- TOP SECTION: Student & Exam Summary --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Profile Card */}
          <Card className="shadow-sm border-l-4 border-l-primary md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Student Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border">
                  {data.student?.profileImage ? (
                    <img
                      src={data.student.profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <GraduationCap className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{data.student?.name}</p>
                  <p className="text-slate-500">{data.student?.rollNumber}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-1 text-slate-600">
                <p>
                  <span className="font-medium text-slate-900">Dept:</span>{" "}
                  {data.student?.department || "N/A"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">College:</span>{" "}
                  {data.student?.collegeName}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exam Performance Card */}
          <Card className="shadow-sm md:col-span-2 relative overflow-hidden">
            <div
              className={`absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform translate-x-4 -translate-y-4`}
            >
              {data.pass ? (
                <CheckCircle className="h-40 w-40 text-green-600" />
              ) : (
                <XCircle className="h-40 w-40 text-red-600" />
              )}
            </div>

            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {data.examTitle}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Performance Summary
                  </CardDescription>
                </div>
                <Badge
                  className={`text-sm px-4 py-1 ${
                    data.pass
                      ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                  }`}
                >
                  {data.pass ? "PASSED" : "FAILED"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold text-slate-900">
                  {data.percentage.toFixed(1)}%
                </span>
                <span className="text-sm text-slate-500 mb-1">
                  ({data.totalScore} / {data.maxScore} Marks)
                </span>
              </div>
              <Progress
                value={data.percentage}
                className={`h-3 ${
                  data.pass ? "bg-green-100" : "bg-red-100"
                }`}
                // Note: You might need a custom class or inline style to change the fill color of Shadcn Progress dynamically
                style={{
                    // This is a hacky way to color the indicator if using standard shadcn. 
                    // Ideally use a specialized progress component or classes.
                    "--progress-background": data.pass ? "#22c55e" : "#ef4444" 
                } as any}
              />

              <div className="grid grid-cols-4 gap-4 mt-6 text-center">
                <div className="bg-slate-100 rounded-lg p-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Total</p>
                  <p className="text-lg font-bold">{data.stats?.totalQuestions || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-green-600 uppercase font-semibold">Passed</p>
                  <p className="text-lg font-bold text-green-700">
                    {data.stats?.passed || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2">
                  <p className="text-xs text-yellow-600 uppercase font-semibold">Partial</p>
                  <p className="text-lg font-bold text-yellow-700">
                    {data.stats?.partial || 0}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-xs text-red-600 uppercase font-semibold">Failed</p>
                  <p className="text-lg font-bold text-red-700">
                    {data.stats?.failed || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- DETAILED SUBMISSIONS --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Detailed Code Analysis
          </h3>

          {data.submissions.map((sub: any, idx: number) => (
            <Card key={idx} className="overflow-hidden shadow-sm border-slate-200">
              {/* Question Header */}
              <div className="bg-slate-50/50 p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="mt-1">
                        {sub.status === "passed" && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {sub.status === "partial" && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                        {sub.status === "failed" && <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      Q{idx + 1}: {sub.questionTitle}
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline" className="text-xs font-normal">
                        {sub.difficulty}
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center">
                         attempts: {sub.attempts}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center">
                         Lang: {sub.language}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                   <div className="text-sm font-medium">
                        Score: <span className={sub.score > 0 ? "text-slate-900" : "text-red-600"}>{sub.score}</span> / {sub.maxMarks}
                   </div>
                   <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Terminal className="h-3 w-3" />
                        Tests: {sub.testCasesPassed} / {sub.totalTestCases} Passed
                   </div>
                </div>
              </div>

              {/* Code Viewer Section */}
              <CardContent className="p-0">
                <div className="grid grid-cols-1">
                    {/* Mock Code Editor Look */}
                    <div className="bg-[#1e1e1e] text-gray-300 p-4 overflow-x-auto font-mono text-sm relative group">
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="bg-slate-700 hover:bg-slate-600 text-xs">Read-only</Badge>
                        </div>
                        <pre className="whitespace-pre-wrap leading-relaxed">
                            <code>{sub.code || "// No code submitted"}</code>
                        </pre>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* --- BOTTOM ACTIONS --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 py-6 border-t">
            <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-destructive gap-2"
                onClick={() => toast({ title: "Report Sent", description: "Admin will review this exam result." })}
            >
                <Flag className="h-4 w-4" />
                Report Issue
            </Button>

            <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none gap-2"
                    onClick={() => navigate("/student/dashboard")}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </Button>

                {/* Show Certificate Button only if eligible */}
                {data.pass && data.certificateEligible && (
                    <Button 
                        className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                        onClick={() => navigate(`/student/certificate/${data.certificateId || examId}`)}
                    >
                        <Download className="h-4 w-4" />
                        Download Certificate
                    </Button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CompilerResultPage;