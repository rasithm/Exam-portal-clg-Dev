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
  const { toast } = useToast();
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  const [examData, setExamData] = useState([]);
  const [students, setStudents] = useState([]);
  const [QuestionData, setQuestionData] = useState([]);
  const [activeTab, setActiveTab] = useState("files"); // "files" or "exams"
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedExamForReport, setSelectedExamForReport] = useState<string>("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
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
    await fetchExams();
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
    setQuestionData(data);
  } catch (err: any) {
    console.error("Error fetching question sets:", err);
    toast({ title: "Error", description: err.message, variant: "destructive" });
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
    fetchExams();
    fetchQuestionSets();
  }, []);

  useEffect(() => {
    const dummyCertificates = [
      {
        examName: "Mid-Term Examination",
        studentName: "Mohamed Rasith",
        studentRegNo: "21ITR024",
        subject: "Web Development",
        date: "2025-11-01",
        percentage: 92,
      },
      {
        examName: "Blockchain Fundamentals",
        studentName: "Mohamed Rasith",
        studentRegNo: "21ITR024",
        subject: "Blockchain Technology",
        date: "2025-10-10",
        percentage: 87,
      },
      {
        examName: "Database Management Test",
        studentName: "Mohamed Rasith",
        studentRegNo: "21ITR024",
        subject: "Database Systems",
        date: "2025-09-18",
        percentage: 95,
      },
    ];

    setCertificates(dummyCertificates);
  }, []);



  

  const [stats, setStats] = useState({ totalStudents: 0, activeExams: 0, completedExams: 0, violations: 0 });
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
  const fetchStats = async () => {
      try {
        
        const res = await fetch(`${API_BASE}/api/admin/students` , {
          credentials: "include",
        });
        const data = await res.json();
        setStats(prev => ({ ...prev, totalStudents: data.total || 0 }));
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

    const handleFetchReport = async (examId: string) => {
      if (!examId) return;
      setReportLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/admin/exams/${examId}/report`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || "Failed to fetch report");
        }
        setReportData(json);
        toast({
          title: "Report Loaded",
          description: `Loaded report for ${json.examName || "exam"}`,
        });
      } catch (err: any) {
        console.error("Report fetch error", err);
        toast({
          title: "Error",
          description: err.message || "Unable to load report",
          variant: "destructive",
        });
      } finally {
        setReportLoading(false);
      }
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
              <Button variant="outline" className="mr-2" >
                <Settings className="h-4 w-4 mr-2" />
                Settings 
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Exams</CardTitle>
                      <CardDescription>Latest examination activities</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleRefreshExams}
                      disabled={loading}
                    >
                      <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                      {loading ? "Refreshing..." : "Refresh"}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {examData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No exams available</p>
                  ) : (
                    examData.map((exam, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 "
                      >
                        <div>
                          <p className="font-medium text-card-foreground uppercase">{exam.title || exam.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {exam.category} • {exam.subcategory || "N/A"}
                          </p>
                        </div>
                        <Badge variant={exam.status === "active" ? "default" : "secondary"}>
                          {exam.status || "General"}
                        </Badge>
                      </div>

                    ))
                  )}
                  <div className="flex justify-evenly">
                    <Button variant="outline" className="w-full mr-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule New Exam
                    </Button>
                    {/* <Button variant="outline" className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      More
                    </Button> */}
                  </div>
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
                        <CreateExam />
                      </div>

                      <div className="space-y-4">
                        {examData.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">No exams found</p>
                        ) : (
                          examData.map((exam, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div>
                                <p className="font-medium text-card-foreground">{exam.fileName}</p>
                                <p className="text-sm text-muted-foreground ">
                                  {exam.category} • {exam.subcategory}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                {exam.collegeTag || "General"}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="files">
                      <div className="py-6 text-center text-muted-foreground">
                        File upload and management coming soon...
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
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reports & Analytics</CardTitle>
                    <CardDescription>
                      Select an exam to view performance summary and export reports.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleExportReport(selectedExamForReport, "xlsx")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleExportReport(selectedExamForReport, "pdf")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Exam Selector */}
                <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-card-foreground mb-1 block">
                      Select Exam
                    </label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={selectedExamForReport}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedExamForReport(id);
                        setReportData(null);
                        if (id) handleFetchReport(id);
                      }}
                    >
                      <option value="">-- Choose an exam --</option>
                      {examData.map((exam: any) => (
                        <option key={exam._id} value={exam._id}>
                          {exam.examName || exam.fileName} ({exam.category} -{" "}
                          {exam.subcategory || "N/A"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Report Content */}
                {reportLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading report...
                  </div>
                )}

                {!reportLoading && !reportData && (
                  <div className="text-center py-8 text-muted-foreground">
                    Select an exam to view its report.
                  </div>
                )}

                {!reportLoading && reportData && (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground">
                          {reportData.examName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Total Attempts: {reportData.attempts} • Total Marks:{" "}
                          {reportData.totalMarks}
                        </p>
                      </div>
                    </div>

                    {reportData.stats && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="shadow-none border">
                          <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Average Score</p>
                            <p className="text-2xl font-bold">
                              {reportData.stats.averageScore.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="shadow-none border">
                          <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">
                              Average Percentage
                            </p>
                            <p className="text-2xl font-bold">
                              {reportData.stats.averagePercentage.toFixed(2)}%
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="shadow-none border">
                          <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Highest Score</p>
                            <p className="text-2xl font-bold">
                              {reportData.stats.highestScore.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="shadow-none border">
                          <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Lowest Score</p>
                            <p className="text-2xl font-bold">
                              {reportData.stats.lowestScore.toFixed(2)}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">
                        Student-wise Performance
                      </h4>
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {reportData.rows.map((row: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md bg-muted/40 gap-2"
                          >
                            <div>
                              <p className="font-medium text-card-foreground">
                                {row.studentName} ({row.rollNumber})
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {row.email}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p>
                                Score:{" "}
                                <span className="font-semibold">{row.score}</span>
                              </p>
                              <p>
                                Percentage:{" "}
                                <span className="font-semibold">
                                  {row.percentage?.toFixed(2)}%
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {row.pass ? "Pass" : "Fail"} • {row.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="Certificates">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Certifications</CardTitle>
                    <CardDescription>
                      Download completion and performance certificates
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => console.log("Exporting All Certificates...")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* ✅ Certificate Data State */}
                {/* UseState added at top of file: */}
                {/* const [certificates, setCertificates] = useState<any[]>([]); */}

                {/* ✅ Fetch Dummy Data */}
                {/* useEffect(() => { setCertificates(dummyCertificates); }, []); */}

                <div className="space-y-4">
                  {certificates.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-card-foreground mb-2">
                        No Certificates Available
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Certificates will appear here once exams are completed and evaluated.
                      </p>
                    </div>
                  ) : (
                    certificates.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border"
                      >
                        {/* Left Section */}
                        <div>
                          <p className="font-semibold text-card-foreground text-base">
                            {cert.examName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {cert.subject} •{" "}
                            {new Date(cert.date).toLocaleDateString("en-IN")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">{cert.studentName}</span>{" "}
                            ({cert.studentRegNo})
                          </p>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-4">
                          <Badge
                            variant={cert.percentage >= 90 ? "default" : "secondary"}
                            className="text-sm px-3 py-1"
                          >
                            {cert.percentage}%
                          </Badge>
                          <Button
                            variant="hero"
                            onClick={() =>
                              console.log(`Downloading ${cert.examName} Certificate`)
                            }
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
        
      </div>
    </div>
  );
};

export default AdminDashboard;