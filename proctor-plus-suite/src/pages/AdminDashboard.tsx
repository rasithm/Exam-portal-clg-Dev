//C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\proctor-plus-suite\src\pages\AdminDashboard.tsx
// line 1
import { useState, useEffect } from "react";
import CreateStudent from "@/components/CreateStudent";
import CreateExam from "@/components/CreateExam";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCcw , LogOut , Trash2 } from "lucide-react";
import {  FileSpreadsheet, Code, BookOpen, Award, Calendar as CalendarIcon, Clock, } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText, 
  Settings, 
  Calendar, 
  BarChart3, 
  AlertTriangle,
  Plus,
  Download,
  Upload,
  Bell 
} from "lucide-react";
import io from "socket.io-client";
import NotificationPopup from "@/components/NotificationPopup";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { baseUrl } from "../constant/Url";
import CreateCompilerExam from "./admin/CreateCompilerExam";
// line ~25 after imports
const API_BASE = baseUrl || "http://localhost:5000";



// line ~44

const socket = io(API_BASE);

const AdminDashboard = () => {
  // const [stats] = useState({
  //   totalStudents: 247,
  //   activeExams: 3,
  //   completedExams: 15,
  //   violations: 2
  // });
// Dummy D
  const { toast } = useToast();
  const navigate = useNavigate();
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  const [examData, setExamData] = useState([]);
  const [students, setStudents] = useState([]);
  const [QuestionData, setQuestionData] = useState([]);
  const [activeTab, setActiveTab] = useState("files"); // "files" or "exams"
  
  // const [certificateStats, setCertificateStats] = useState([]);
  //   type CertificateOverview = {
  //   total: number;
  //   mcq: number;
  //   compiler: number;
  // };

 const [certificateOverview, setCertificateOverview] = useState({
    total: 0,
    mcq: 0,
    compiler: 0
  });



  
  const [certificateExams, setCertificateExams] = useState<any[]>([]);

  const [selectedExamForReport, setSelectedExamForReport] = useState<string>("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [mcqExams, setMcqExams] = useState<any[]>([]);
  const [compilerExams, setCompilerExams] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>("");
  const [reports, setReports] = useState<any[]>([]);
  
  // const fetchExams = async () => {
  //   try {
  //     const res = await axios.get("/api/admin/exams/all");
  //     setExams(res.data);
  //     toast.success("Exam data refreshed");
  //   } catch (err) {
  //     console.error("Error fetching exams:", err);
  //     toast.error("Failed to fetch exams");
  //   }
  // };


  const fetchExams = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/admin/exams/list`, {
      credentials: "include", // important for cookies
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server Error ${res.status}: ${text.slice(0, 80)}`);
    }

    const data = await res.json();
    setExamData(data);
  } catch (err: any) {
    console.error("Error fetching exams:", err);
    toast({ title: "Error", description: err.message, variant: "destructive" });
  }
};

const handleRefreshExams = async () => {
  setLoading(true);
  try {
    await Promise.all([
      fetchMcqExams(),
      fetchCompilerExams(),
      fetchQuestionSets(),

    ]);

    toast({
      title: "✅ Refreshed",
      description: "Exam list updated successfully",
    });
  } catch (err) {
    console.error("Error refreshing exams:", err);
  } finally {
    setLoading(false);
  }
};


const fetchQuestionSets = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/admin/questions/list`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server Error ${res.status}: ${text.slice(0, 80)}`);
    }

    const data = await res.json();
    setUploadedFiles(data);
  } catch (err: any) {
    console.error("Error fetching question sets:", err);
    toast({ title: "Error", description: err.message, variant: "destructive" });
  }
};

const fetchCertificates = async () => {
  try {
    setLoading(true);

    const res = await fetch(`${API_BASE}/api/admin/certificates/summary`, {
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch certificates");

    const data = await res.json();

    // ✅ SAFE DEFAULTS
    const safeData = {
      total: data?.total || 0,
      mcq: data?.mcq || 0,
      compiler: data?.compiler || 0,
      exams: data?.exams || [],
    };

    setCertificateOverview(safeData);
    setCertificateExams(safeData.exams);

    setStats((prev) => ({
      ...prev,
      totalCertificates: safeData.total,
    }));
  } catch (err) {
    console.error(err);

    toast({
      title: "Error",
      description: "Failed to load certificates",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};


const fetchReports = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/admin/reports/summary`, {
      credentials: "include",
    });

    const data = await res.json();
    setReports(data || []);
  } catch (err) {
    console.error(err);
  }
};




  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/students` , {
          credentials: "include",
        });
        const data = await res.json();
        setRecentStudents(data.students || []);
        console.log(data.students)
      } catch (err) {
        console.error("Failed to fetch students", err);
      }
    };
    fetchStudents();
  }, []);
  useEffect(() => {
    fetchMcqExams();
    fetchCompilerExams();
    fetchQuestionSets();
  }, []);


  useEffect(() => {
    fetchCertificates();

  }, []);

  useEffect(() => {
  fetchReports();
}, []);




  

  const [stats, setStats] = useState({ totalStudents: 0, activeExams: 0, completedExams: 0, violations: 0 ,totalCertificates: 0});
  useEffect(() => {
    const fetchStats = async () => {
      try {
        
        const res = await fetch(`${API_BASE}/api/admin/students` , {
          credentials: "include",
        });
        const data = await res.json();
        setStats(prev => ({ ...prev, totalStudents: data.total || 0 }));
      } catch(err) { console.error(err); }
    };
    fetchStats();
  }, []);
  useEffect(() => {
    const fetchStatsCount = async () => {
      try {
        
        const res = await fetch(`${API_BASE}/api/admin/counts` , {
          credentials: "include",
        });
        const data = await res.json();
        setStats(prev => ({ ...prev, activeExams: data.activeExams || 0 , completedExams : data.completedExams || 0, violations : data.violations || 0 }));
      } catch(err) { console.error(err); }
    };
    fetchStatsCount();
  }, []);
  const fetchStats = async () => {
      try {
        
        const res = await fetch(`${API_BASE}/api/admin/students` , {
          credentials: "include",
        });
        const data = await res.json();
        setStats(prev => ({ ...prev, totalStudents: data.total || 0 }));
      } catch(err) { console.error(err); }
    };
  const fetchStatsCount = async () => {
      try {
        
        const res = await fetch(`${API_BASE}/api/admin/counts` , {
          credentials: "include",
        });
        const data = await res.json();
        setStats(prev => ({ ...prev, activeExams: data.activeExams || 0 , completedExams : data.completedExams || 0, violations : data.violations || 0 }));
      } catch(err) { console.error(err); }
    };
   const handleRefreshStudent = async () => {
      await fetchStats();
      toast({
        title: "🔁 Refreshed",
        description: "Students list updated",
      });
    };

    const handleDeleteStudent = async (studentId: string, name: string) => {
      if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

      try {
        const res = await fetch(`${API_BASE}/api/admin/students/${studentId}`, {
          method: "DELETE",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to delete student");
        }

        toast({
          title: "🗑️ Student Deleted",
          description: `${name} has been removed successfully.`,
        });

        // Update list instantly
        setRecentStudents((prev) => prev.filter((s) => s.id !== studentId));
        setStats((prev) => ({ ...prev, totalStudents: prev.totalStudents - 1 }));
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Deletion failed",
          variant: "destructive",
        });
      }
    };

    const fetchMcqExams = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/exams/list`, {
          credentials: "include",
        });
        const data = await res.json();
        setMcqExams(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCompilerExams = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/compilerExams/list`, {
          credentials: "include",
        });
        const data = await res.json();
        setCompilerExams(data || []);
      } catch (err) {
        console.error(err);
      }
    };



    const handleDownloadReport = async (examId: string, type: "xlsx") => {
      const url = `${API_BASE}/api/admin/reports/${examId}/export.xlsx`;

      const res = await fetch(url, { credentials: "include" });
      const blob = await res.blob();

      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = `exam_${examId}_report.xlsx`;
      a.click();
    };

    const handleDownloadStudentPDF = async () => {
      if (!selectedExamForReport || !selectedStudentForReport) {
        toast({
          title: "Select Exam & Student",
          variant: "destructive",
        });
        return;
      }

      const url = `/admin/report-view/${selectedExamForReport}/${selectedStudentForReport}`;

      window.open(url, "_blank");
    };



    const handleExportReport = async (examId: string, type: "xlsx" | "pdf") => {
      if (!examId) {
        toast({
          title: "Select Exam",
          description: "Please select an exam before exporting.",
          variant: "destructive",
        });
        return;
      }

      const endpoint =
        type === "xlsx"
          ? `${API_BASE}/api/admin/exams/${examId}/report.xlsx`
          : `${API_BASE}/api/admin/exams/${examId}/report.pdf`;

      try {
        const res = await fetch(endpoint, { credentials: "include" });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Export failed");
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          type === "xlsx"
            ? `exam_${examId}_report.xlsx`
            : `exam_${examId}_report.pdf`;
        a.click();
      } catch (err: any) {
        console.error("Export error", err);
        toast({
          title: "Export Failed",
          description: err.message || "Unable to export report",
          variant: "destructive",
        });
      }
    };

    const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "published":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "scheduled":
      case "draft":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "completed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getExamStatus = (start: string, end: string) => {
    const now = new Date();
    const s = new Date(start);
    const e = new Date(end);

    if (now < s) return "upcoming";
    if (now > e) return "completed";
    return "active";
  };


  

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };




  // const [recentExams] = useState([
  //   { id: 1, title: "Computer Science Midterm", students: 45, date: "2024-01-15", status: "active" },
  //   { id: 2, title: "Mathematics Final", students: 32, date: "2024-01-12", status: "completed" },
  //   { id: 3, title: "Physics Quiz", students: 28, date: "2024-01-10", status: "completed" }
  // ]);

  // const [recentStudents] = useState([
  //   { id: 1, name: "John Smith", studentId: "CS2024001", email: "john@college.edu", status: "active" },
  //   { id: 2, name: "Sarah Johnson", studentId: "CS2024002", email: "sarah@college.edu", status: "active" },
  //   { id: 3, name: "Mike Chen", studentId: "CS2024003", email: "mike@college.edu", status: "inactive" }
  // ]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-card-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage students, exams, and monitor system activity</p>
            </div>
            <div>
              <Button variant="outline" className="mr-2"  onClick={() => setShowNotifications(true)}>
                <Bell  className="h-6 w-6 mr-2" />
                Notification 
              </Button>
              <NotificationPopup open={showNotifications} onClose={() => setShowNotifications(false)} />
              <Button variant="outline" className="mr-2"  onClick={() => navigate("/admin/profile")}>
                <Settings className="h-4 w-4 mr-2" />
                Profile 
              </Button>
              
              <Button variant="outline" 
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/api/auth/admin/logout`, {
                      method: "POST",
                      credentials: "include",
                    });

                    if (!res.ok) throw new Error("Failed to log out");

                    toast({
                      title: "👋 Logged Out",
                      description: "You have been logged out successfully.",
                    });

                    // Optional: redirect to login page
                    setTimeout(() => {
                      window.location.href = "/login";
                    }, 1000);
                  } catch (err) {
                    console.error(err);
                    toast({
                      title: "Error",
                      description: "Logout failed. Try again.",
                      variant: "destructive",
                    });
                  }
                }} >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold text-card-foreground">{stats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Exams</p>
                  <p className="text-3xl font-bold text-card-foreground">{stats.activeExams}</p>
                </div>
                <FileText className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Exams</p>
                  <p className="text-3xl font-bold text-card-foreground">{stats.completedExams}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Certificates</p>
                  <p className="text-3xl font-bold text-card-foreground">{stats.totalCertificates}</p>
                </div>
                <div className="p-2.5 rounded-full bg-amber-500/10">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-warning">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Violations</p>
                  <p className="text-3xl font-bold text-warning">{stats.violations}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="Certificates">Certificates</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Exams */}
              {/* <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Recent Exams</CardTitle>
                  <CardDescription>Latest examination activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-card-foreground">{exam.title}</p>
                        <p className="text-sm text-muted-foreground">{exam.students} students • {exam.date}</p>
                      </div>
                      <Badge variant={exam.status === "active" ? "default" : "secondary"}>
                        {exam.status}
                      </Badge>
                    </div>
                  ))}
                  <div className="flex justify-evenly">
                    <Button variant="outline" className="w-full mr-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule New Exam
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      More
                    </Button>
                  </div>
                  
                  
                </CardContent>
              </Card> */}
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Recent Exams</CardTitle>
                      <CardDescription>Latest examination activities</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefreshExams} disabled={loading}>
                      <RefreshCcw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...mcqExams.slice(0, 2), ...compilerExams.slice(0, 1)].map((exam: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${exam.language ? 'bg-violet-100' : 'bg-blue-100'}`}>
                          {exam.language ? <Code className="h-4 w-4 text-violet-600" /> : <BookOpen className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground text-sm">{exam.title || exam.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {exam.language || exam.category} • {exam.questionCount} Questions
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(exam.status)}`}>
                        {exam.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>


              {/* Admin Info Card */}
              <Card className="shadow-card border-primary">
                <CardHeader>
                  <CardTitle className="text-primary">Admin Privileges</CardTitle>
                  <CardDescription>You have full administrative control</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Create & manage student accounts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-secondary" />
                    <span>Design & schedule examinations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-success" />
                    <span>Access all reports & analytics</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span>Monitor security violations</span>
                  </div>
                  <div className="pt-3">
                    <CreateStudent />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Students Overview */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Students</CardTitle>
                <CardDescription>Student accounts you've created recently</CardDescription>

              </CardHeader>
              <CardContent className="space-y-4">
                {recentStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-card-foreground">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.rollNumber} • {student.email}</p>
                    </div>
                    <Badge variant={student.online === "active" ? "default" : "secondary"}>
                      {student.online ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
                <div className="flex justify-between">
                  <CreateStudent />
                  {/* <Button variant="outline" className="w-full">
                      <Calendar className="h-6 w-6 mr-2" />
                      More
                    </Button> */}
                </div>
                
                
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>Create student accounts and manage access credentials. Only admins can create student logins.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center gap-2"
                      onClick={handleRefreshStudent}
                        disabled={loading}
                          >
                                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                {loading ? "Refreshing..." : "Refresh"}
                              </Button>
                    <CreateStudent />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Student List */}
                <div className="space-y-4">
                  {recentStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary-light">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.rollNumber} • {student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge  variant={student.online === "active" ? "default" : "secondary"}>
                          {student.online ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm" 
                        // onClick={() => window.openCreateStudentWithData(student)}
                          >Edit</Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteStudent(student.id, student.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-6 bg-primary-light rounded-lg">
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Admin Control</h3>
                  <p className="text-muted-foreground mb-4">
                    As an administrator, you have full control over student accounts. Students cannot self-register - 
                    only you can create their login credentials and manage their access to the examination system.
                  </p>
                  <div className="flex gap-2">
                    <CreateStudent />
                    <Button variant="outline" onClick={async () => {
                          const res = await fetch(`${API_BASE}/api/admin/students/export`, {
                            credentials: "include",
                          });
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "students_export.csv";
                          a.click();
                        }}
                        >
                      <Download className="h-4 w-4 mr-2" />
                      Export Student List
                    </Button>
                    {/* <Button variant="outline" className="w-full">
                      <Calendar className="h-6 w-6 mr-2" />
                      More
                    </Button> */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exams">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Exam Management</CardTitle>
                    <CardDescription>Create, schedule, and manage examinations</CardDescription>
                  </div>
                  {/* <div className=""> */}
                    {/* <Button
                                variant="outline"
                                className="flex-1 flex items-center gap-2"
                                onClick={handleRefresh}
                                disabled={loading}
                              >
                                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                {loading ? "Refreshing..." : "Refresh"}
                              </Button> */}
                    {/* <Button variant="hero">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Exam
                    </Button> */}
                    {/* <CreateExam /> */}
                  {/* </div> */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Tabs defaultValue="exams" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="exams">Exams</TabsTrigger>
                      <TabsTrigger value="files">Files</TabsTrigger>
                    </TabsList>

                    <TabsContent value="exams">
                      <div className="flex justify-end mb-3">
                        <Button
                          variant="outline"
                          onClick={handleRefreshExams}
                          disabled={loading}
                          className="mr-2 h-13"
                        >
                          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                          {loading ? "Refreshing..." : "Refresh"}
                        </Button>
                        <Button variant="hero" className="mr-2 h-13" onClick={() => navigate("/admin/exam/create/compiler")}>
                          <Plus className="h-4 w-4 mr-2"  />
                          Create Compiler Exam
                        </Button>
                        <CreateExam />
                      </div>

                      {/* MCQ Exams Section */}
                      <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          MCQ Exams
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {mcqExams.map((exam) => (
                            <div key={exam._id} className="p-4 rounded-xl border bg-gradient-to-br from-blue-50/50 to-white hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-blue-100">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-card-foreground text-sm">{exam.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{exam.category} • {exam.subcategory}</p>
                                  </div>
                                </div>
                                <Badge className={`text-xs ${getStatusColor(getExamStatus(exam.startDateTime, exam.endDateTime))}`}>
                                  {getExamStatus(exam.startDateTime, exam.endDateTime)}
                                </Badge>

                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white/80 border">
                                  <p className="text-muted-foreground">Questions</p>
                                  <p className="font-semibold text-card-foreground">{exam.questionCount}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/80 border">
                                  <p className="text-muted-foreground">Duration</p>
                                  <p className="font-semibold text-card-foreground">{exam.duration} min</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/80 border">
                                  <p className="text-muted-foreground">Marks</p>
                                  <p className="font-semibold text-card-foreground">{exam.totalMarks}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  {formatDate(exam.startDateTime)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  {formatDate(exam.endDateTime)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(exam.startDateTime)} - {formatTime(exam.endDateTime)}
                                </span>
                                {exam.generateCertificate && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 ml-8">
                                    <Award className="h-3 w-3 mr-1" />
                                    Certificate
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Compiler Exams Section */}
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          Compiler Exams
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {compilerExams.map((exam) => (
                            <div key={exam._id} className="p-4 rounded-xl border bg-gradient-to-br from-violet-50/50 to-white hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-2 rounded-lg bg-violet-100">
                                    <Code className="h-4 w-4 text-violet-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-card-foreground text-sm">{exam.title}</p>
                                    <p className="text-xs text-muted-foreground">{exam.language}</p>
                                  </div>
                                </div>
                                <Badge className={`text-xs ${getStatusColor(getExamStatus(exam.startDateTime, exam.endDateTime))}`}>
                                  {getExamStatus(exam.startDateTime, exam.endDateTime)}
                                </Badge>

                              </div>
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="p-2 rounded-lg bg-white/80 border">
                                  <p className="text-muted-foreground">Questions</p>
                                  <p className="font-semibold text-card-foreground">{exam.questionCount}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/80 border">
                                  <p className="text-muted-foreground">Duration</p>
                                  <p className="font-semibold text-card-foreground">{exam.duration} min</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/80 border">
                                  <p className="text-muted-foreground">Marks</p>
                                  <p className="font-semibold text-card-foreground">{exam.totalMarks}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/80 border">
                                  <p className="text-muted-foreground">Per Q</p>
                                  <p className="font-semibold text-card-foreground">{exam.perQuestionMark}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {formatDate(exam.startTime)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {formatDate(exam.endTime)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
                                  </span>
                                </div>
                                {exam.generateCertificate && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                    <Award className="h-3 w-3 mr-1" />
                                    Certificate
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="files">
                      <div className="flex justify-end mb-4">
                        
                        <Button
                          variant="outline"
                          onClick={handleRefreshExams}
                          disabled={loading}
                          className="mr-2 h-13"
                        >
                          <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                          {loading ? "Refreshing..." : "Refresh"}
                        </Button>

                      </div>
                      <div className="space-y-2">
                        {uploadedFiles.map((file) => (
                          <div key={file._id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 pr-0 rounded-lg bg-emerald-100">
                                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-medium text-card-foreground text-sm  text-start">{file.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {file.category} • {file.subcategory} • {file.questions?.length || 0} Questions • {formatDate(file.createdAt)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={async () => {
                                if (!window.confirm(`Delete ${file.fileName}?`)) return;

                                await fetch(`${API_BASE}/api/admin/questions/${file._id}`, {
                                  method: "DELETE",
                                  credentials: "include",
                                });

                                fetchQuestionSets(); // refresh from DB

                                toast({ title: "🗑️ Deleted", description: `${file.fileName} removed.` });
                              }}

                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {uploadedFiles.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No files uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* {!activeTab === "files" ? (<FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Exam Creation</h3>
                  <p className="text-muted-foreground mb-4">Design secure exams with multiple question types and anti-cheating measures</p>
                  <Button variant="hero">Create Your First Exam</Button>)} */}
                  
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Exam Selection for Report */}
              <Card className="shadow-card border-primary/20">
                <CardHeader>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Exam Report
                    </CardTitle>
                    <CardDescription>Select an exam to view and download its report</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-card-foreground mb-2 block">Select Exam</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background"
                      value={selectedExamForReport}
                      onChange={(e) => setSelectedExamForReport(e.target.value)}
                    >
                      <option value="">-- Select an Exam --</option>
                      {reports.map((exam) => (
                        <option key={exam.examId} value={exam.examId}>
                          {exam.examName} ({exam.examType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedExamForReport && (() => {
                    const selectedReport = reports.find(r => r.examId === selectedExamForReport);
                    if (!selectedReport) return null;
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="p-4 rounded-xl bg-muted/50 border text-center">
                            <p className="text-2xl font-bold text-card-foreground">{selectedReport.totalStudents}</p>
                            <p className="text-xs text-muted-foreground mt-1">Total Students</p>
                          </div>
                          <div className="p-4 rounded-xl bg-muted/50 border text-center">
                            <p className="text-2xl font-bold text-emerald-600">{selectedReport.avgPercentage}%</p>
                            <p className="text-xs text-muted-foreground mt-1">Avg Score</p>
                          </div>
                          <div className="p-4 rounded-xl bg-muted/50 border text-center">
                            <p className={`text-2xl font-bold ${selectedReport.passRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{selectedReport.passRate}%</p>
                            <p className="text-xs text-muted-foreground mt-1">Pass Rate</p>
                          </div>
                          <div className="p-4 rounded-xl bg-muted/50 border text-center">
                            <p className="text-2xl font-bold text-blue-600">{formatDate(selectedReport.completedDate)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Completed</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" className="flex-1" onClick={() => handleDownloadReport(selectedExamForReport, "xlsx")}>
                            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                            Download Excel (Data)
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  {!selectedExamForReport && (
                    <div className="text-center py-6 text-muted-foreground">
                      <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Select an exam to view report data</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Individual Exam Reports */}
              <Card className="shadow-card">
                <CardHeader>
                  <div>
                    <CardTitle>Individual Exam Reports</CardTitle>
                    <CardDescription>Download Excel for data visualization or PDF for printable reports</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reports.map((report) => (
                      <div key={report.examId} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${report.examType === "MCQ" ? "bg-blue-100" : "bg-violet-100"}`}>
                            {report.examType === "MCQ" ? (
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Code className="h-5 w-5 text-violet-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{report.examName}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.examType} • {report.totalStudents} students • {formatDate(report.completedDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-4 text-sm mr-4">
                            <div className="text-center">
                              <p className="font-semibold text-card-foreground">{report.avgPercentage}%</p>
                              <p className="text-xs text-muted-foreground">Avg</p>
                            </div>
                            <div className="text-center">
                              <p className={`font-semibold ${report.passRate >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{report.passRate}%</p>
                              <p className="text-xs text-muted-foreground">Pass</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDownloadReport(report.examId, "xlsx")}
                              title="Download Excel"
                            >
                              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                            </Button>
                            
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Specific Report Generator */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Generate Custom Report</CardTitle>
                  <CardDescription>Select exam and student to generate specific reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">Select Exam</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background"
                        value={selectedExamForReport}
                        onChange={(e) => setSelectedExamForReport(e.target.value)}
                      >
                        <option value="">-- All Exams --</option>
                        {reports.map((exam) => (
                          <option key={exam.examId} value={exam.examId}>
                            {exam.examName} ({exam.examType})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-card-foreground mb-2 block">Select Student</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2.5 text-sm bg-background"
                        value={selectedStudentForReport}
                        onChange={(e) => setSelectedStudentForReport(e.target.value)}
                      >
                        <option value="">-- All Students --</option>
                        {recentStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} ({student.rollNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => {
                      if (selectedExamForReport && selectedStudentForReport) {
                        window.open(
                          `${API_BASE}/api/admin/reports/${selectedExamForReport}/student/${selectedStudentForReport}/export.xlsx`
                        );
                      } else if (selectedExamForReport) {
                        handleDownloadReport(selectedExamForReport, "xlsx");
                      } else {
                        toast({ title: "Select exam", variant: "destructive" });
                      }
                    }}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                      Download Excel
                    </Button>
                    <Button variant="default" className="flex-1" onClick={handleDownloadStudentPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="Certificates">
            <Card className="shadow-card border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Certificate Overview</CardTitle>
                    <CardDescription>
                      Overall certification statistics & downloads
                    </CardDescription>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchCertificates}
                    disabled={loading}
                  >
                    <RefreshCcw
                      className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* ================= STATS CARDS ================= */}
                {certificateOverview?.total === 0 ? (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
                    <p className="text-muted-foreground">
                      Certificates will appear once students complete exams
                    </p>
                  </div>
                ) : (
                  <>
                    {/* ===== Top Stats ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                      {/* TOTAL */}
                      <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-amber-200">
                            <Award className="h-6 w-6 text-amber-700" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-amber-700 uppercase">
                              Total Certificates
                            </p>
                            <p className="text-2xl font-bold text-amber-800">
                              {certificateOverview.total || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* MCQ */}
                      <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-blue-200">
                            <BookOpen className="h-6 w-6 text-blue-700" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-700 uppercase">
                              MCQ Certificates
                            </p>
                            <p className="text-2xl font-bold text-blue-800">
                              {certificateOverview.mcq || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* COMPILER */}
                      <div className="p-5 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 border border-violet-200">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-xl bg-violet-200">
                            <Code className="h-6 w-6 text-violet-700" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-violet-700 uppercase">
                              Compiler Certificates
                            </p>
                            <p className="text-2xl font-bold text-violet-800">
                              {certificateOverview.compiler || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ================= EXAM LIST ================= */}
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Exams with Certificates Issued
                    </h3>

                    <div className="space-y-3">
                      {certificateExams.map((exam) => (
                        <div
                          key={exam.examId}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition"
                        >
                          {/* Left */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-lg ${
                                exam.examType === "MCQ"
                                  ? "bg-blue-100"
                                  : "bg-violet-100"
                              }`}
                            >
                              {exam.examType === "MCQ" ? (
                                <BookOpen className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Code className="h-5 w-5 text-violet-600" />
                              )}
                            </div>

                            <div>
                              <p className="font-medium">{exam.examName}</p>
                              <p className="text-xs text-muted-foreground">
                                {exam.examType} • {exam.count} issued • Last Issue {formatDate(exam.lastDate)} • Completed {formatDate(exam.completedDate)}

                              </p>
                            </div>
                          </div>

                          {/* Right */}
                          {exam.count > 0 ? <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `${API_BASE}/api/admin/certificates/${exam.examId}/zip`,
                                "_blank"
                              )
                            }
                          >
                            <Download className="h-4 w-4 mr-1.5" />
                            Download All
                          </Button> : "" }
                          
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
      </div>
    </div>
  );
};

export default AdminDashboard;