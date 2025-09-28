import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Play,
  BarChart3,
  Calendar,
  User
} from "lucide-react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  
  const [studentInfo] = useState({
    name: "John Smith",
    studentId: "CS2024001",
    email: "john@college.edu",
    department: "Computer Science"
  });

  const [upcomingExams] = useState([
    {
      id: 1,
      title: "Data Structures Final",
      subject: "Computer Science",
      date: "2024-01-20",
      time: "10:00 AM",
      duration: 120,
      status: "upcoming",
      description: "Comprehensive final examination covering all data structures topics"
    },
    {
      id: 2,
      title: "Mathematics Quiz",
      subject: "Mathematics",
      date: "2024-01-18",
      time: "2:00 PM",
      duration: 60,
      status: "upcoming",
      description: "Quiz on calculus and linear algebra"
    }
  ]);

  const [recentExams] = useState([
    {
      id: 3,
      title: "Database Systems Midterm",
      subject: "Computer Science",
      date: "2024-01-10",
      score: 85,
      totalMarks: 100,
      status: "completed"
    },
    {
      id: 4,
      title: "Operating Systems Quiz",
      subject: "Computer Science", 
      date: "2024-01-08",
      score: 92,
      totalMarks: 100,
      status: "completed"
    }
  ]);

  const handleStartExam = (examId: number) => {
    navigate(`/exam/${examId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming": return "default";
      case "completed": return "secondary";
      case "in-progress": return "warning";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Student Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {studentInfo.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-card-foreground">{studentInfo.studentId}</p>
                <p className="text-sm text-muted-foreground">{studentInfo.department}</p>
              </div>
              <div className="p-2 rounded-full bg-primary-light">
                <User className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Exams</p>
                  <p className="text-3xl font-bold text-card-foreground">{upcomingExams.length}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Exams</p>
                  <p className="text-3xl font-bold text-card-foreground">{recentExams.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <p className="text-3xl font-bold text-card-foreground">
                    {Math.round(recentExams.reduce((acc, exam) => acc + (exam.score / exam.totalMarks * 100), 0) / recentExams.length)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Exams */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Upcoming Exams
              </CardTitle>
              <CardDescription>Scheduled examinations requiring your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground mb-1">{exam.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{exam.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {exam.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {exam.time}
                        </span>
                        <span>{exam.duration} mins</span>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(exam.status)}>
                      {exam.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Subject: {exam.subject}
                    </span>
                    <Button 
                      variant="hero" 
                      size="sm"
                      onClick={() => handleStartExam(exam.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Exam
                    </Button>
                  </div>
                </div>
              ))}
              
              {upcomingExams.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming exams scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Results */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-success" />
                Recent Results
              </CardTitle>
              <CardDescription>Your latest exam performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentExams.map((exam) => (
                <div key={exam.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground mb-1">{exam.title}</h3>
                      <p className="text-sm text-muted-foreground">{exam.subject} • {exam.date}</p>
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium text-card-foreground">
                        {exam.score}/{exam.totalMarks} ({Math.round((exam.score / exam.totalMarks) * 100)}%)
                      </span>
                    </div>
                    <Progress 
                      value={(exam.score / exam.totalMarks) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
              
              {recentExams.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed exams yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Card className="shadow-card border-warning mt-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-warning mt-1" />
              <div>
                <h3 className="font-semibold text-card-foreground mb-2">Exam Security Notice</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  During examinations, please ensure you have a stable internet connection and avoid switching tabs or applications. 
                  The system monitors for violations and may automatically submit your exam if suspicious activity is detected.
                  Make sure you're in a quiet environment with proper lighting for any proctoring requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;