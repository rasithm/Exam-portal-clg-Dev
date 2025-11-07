
import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, CheckCircle2, XCircle, Award, Calendar, Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ExamCompleted = () => {
  const navigate = useNavigate();

  // ✅ Dummy data (to be replaced with API later)
  const [result] = useState({
    student: {
      name: "Mohamed Rasith",
      regno: "22CSE101",
      department: "Computer Science & Engineering",
      photo: "https://i.pravatar.cc/150?img=12",
    },
    exam: {
      name: "Blockchain Fundamentals",
      subject: "Blockchain Technology",
      type: "Technical",
      duration: "120 mins",
      date: "Nov 05, 2025",
      time: "10:00 AM - 12:00 PM",
    },
    score: 86,
    totalMarks: 100,
    percentage: 86,
    pass: true,
    completedAt: "Nov 05, 2025, 12:00 PM",
  });

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center py-10 px-4">
      {/* 🏆 Congratulations Banner */}
      {result.pass && (
        <div className="mb-8 text-center animate-fade-in">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-card-foreground">
            Congratulations, {result.student.name}! 🎉
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            You’ve successfully passed your <span className="font-semibold">{result.exam.name}</span> exam.
          </p>
        </div>
      )}

      {!result.pass && (
        <div className="mb-8 text-center">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-card-foreground">Exam Completed</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Don’t worry, {result.student.name}. You can retake your exam and improve your score next time.
          </p>
        </div>
      )}

      {/* Main Result Card */}
      <Card className="shadow-card w-full max-w-4xl border border-border bg-card animate-slide-up">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <img
              src={result.student.photo}
              alt={result.student.name}
              className="h-20 w-20 rounded-full object-cover border-4 border-primary"
            />
            <div>
              <CardTitle className="text-2xl">{result.student.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                Reg No: {result.student.regno} • {result.student.department}
              </CardDescription>
            </div>
          </div>
          <Badge variant={result.pass ? "success" : "destructive"} className="text-lg px-4 py-1">
            {result.pass ? "Passed" : "Failed"}
          </Badge>
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Exam Details</h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> {result.exam.name}
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> {result.exam.date}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> {result.exam.time}
              </li>
              <li className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> {result.exam.type}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Performance Summary</h3>
            <div className="text-muted-foreground text-sm space-y-2">
              <p>Score: <span className="font-semibold">{result.score}/{result.totalMarks}</span></p>
              <p>Percentage: <span className="font-semibold">{result.percentage}%</span></p>
              <p>Completed At: <span className="font-semibold">{result.completedAt}</span></p>
              <Progress
                value={result.percentage}
                className={`h-2 ${result.pass ? "bg-success/30" : "bg-destructive/30"}`}
              />
            </div>
          </div>
        </CardContent>

        {/* Footer - Buttons */}
        <div className="border-t p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          {result.pass ? (
            <Button
              variant="hero"
              onClick={() => alert("📜 Downloading certificate...")}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate("/student/dashboard")}
              className="w-full sm:w-auto"
            >
              Try Again
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => navigate("/student/dashboard")}
            className="w-full sm:w-auto"
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>

      {/* Branding / Footer */}
      <p className="mt-8 text-muted-foreground text-sm">
        Powered by <span className="font-medium text-primary">ProctorPlus</span> • Secure AI Exam Suite ©2025
      </p>
    </div>
  );
};

export default ExamCompleted;
