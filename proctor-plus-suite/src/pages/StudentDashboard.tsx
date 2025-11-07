//C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\proctor-plus-suite\src\pages\StudentDashboard.tsx
import { useState , useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { RefreshCcw , LogOut } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { baseUrl } from "../constant/Url";
const API_BASE = baseUrl || "http://localhost:5000";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const StudentDashboard = () => {

  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  // Modal state
  const [showRules, setShowRules] = useState(false);
  const [scrollEnd, setScrollEnd] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tech");


  // ✅ Fetch exams for this student
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/student/dashboard`, {
          withCredentials: true,
        });
        const data = res.data;

        setStudentInfo(data.student);
        setUpcomingExams(data.upcomingExams);
        setRecentExams(data.completedExams);

        const avg =
          data.completedExams.length > 0
            ? Math.round(
                data.completedExams.reduce(
                  (acc, exam) => acc + (exam.score / exam.totalMarks) * 100,
                  0
                ) / data.completedExams.length
              )
            : 0;
        setAverageScore(avg);
      } catch (err: any) {
        console.error("Dashboard load error:", err);
        toast.error("Failed to load student data.");
        setStudentInfo({ name: "Guest", studentId: "-", department: "-" });
      }
    };

    fetchDashboardData();
  }, [navigate]);
  
    // 🔐 Advanced Browser Extension Detection (for production)
useEffect(() => {
  const suspiciousPatterns = ["chrome-extension://", "moz-extension://", "safari-extension://"];

  const handleSuspiciousActivity = (reason: string) => {
    toast.error(`⚠️ Unauthorized browser extension detected (${reason})! Please disable extensions.`);
    setTimeout(() => {
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    }, 1500);
  };

  // --- Interval-based check (every few seconds)
  const checkForExtensions = () => {
    const scripts = Array.from(document.querySelectorAll("script, iframe"));
    const found = scripts.some((el) => {
      const src = (el as HTMLScriptElement | HTMLIFrameElement).src || el.baseURI || "";
      return suspiciousPatterns.some((pattern) => src.includes(pattern));
    });
    if (found) handleSuspiciousActivity("periodic scan");
  };

  // Initial check
  checkForExtensions();

  // Re-check every 5 seconds
  const interval = setInterval(checkForExtensions, 5000);

  // --- Real-time detection (Mutation Observer)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLScriptElement || node instanceof HTMLIFrameElement) {
          const src = node.src || node.baseURI || "";
          if (suspiciousPatterns.some((pattern) => src.includes(pattern))) {
            observer.disconnect(); // stop observing before logout
            handleSuspiciousActivity("real-time detection");
            break;
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Cleanup
  return () => {
    clearInterval(interval);
    observer.disconnect();
  };
}, [navigate]);


  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const start = performance.now();
        await fetch(window.location.origin, { cache: "no-store" });
        const end = performance.now();
        if (end - start > 3000) {
          toast.error("⚠️ Network delay detected. Possible proxy interference.");
          navigate("/login");
        }
      } catch {
        toast.error("⚠️ Network tampering detected!");
        navigate("/login");
      }
    };

    const timer = setInterval(checkNetwork, 10000);
    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      if (window.outerWidth - window.innerWidth > 160) {
        toast.error("⚠️ Developer tools detected!");
        navigate("/login");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

  // ✅ Security — Disable Right-Click, Shortcuts, Tab Switch, Extensions
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        [123, 73, 74, 85, 67, 86, 88, 83].includes(e.keyCode)
      ) {
        e.preventDefault();
        toast.warning("Keyboard shortcuts are disabled during your session!");
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        setWarningCount((prev) => prev + 1);
        toast.warning("Tab switch detected!");
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.warning("Copy-Paste disabled!");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);

    // Detect Browser Extensions / AI Tools
    setTimeout(() => {
      const suspicious = [
        "ChatGPT",
        "Copilot",
        "AIPRM",
        "Merlin",
        "Grammarly",
        "Compose AI",
      ];
      const extensions = document.querySelectorAll("iframe, script");
      extensions.forEach((el) => {
        suspicious.forEach((tool) => {
          if (el.outerHTML.includes(tool)) {
            toast.error("Unauthorized browser extension detected!");
            navigate("/login");
          }
        });
      });
    }, 2000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
    };
  }, [navigate]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.info("Right-click disabled for exam security.");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        ["u", "U", "s", "S", "p", "P", "i", "I", "j", "J"].includes(e.key)
      ) {
        e.preventDefault();
        toast.error("⚠️ Inspect/Shortcut blocked!");
      }
      if (e.key === "F12") {
        e.preventDefault();
        toast.error("⚠️ Inspect mode disabled!");
      }
    };

    const handleResize = () => {
      if (window.outerWidth - window.innerWidth > 150) {
        toast.error("⚠️ Developer tools detected!");
        setTimeout(() => navigate("/login"), 1000);
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [navigate]);

  // ✅ Redirect after repeated violations
  useEffect(() => {
    if (warningCount >= 10) {
      toast.error("Multiple security violations detected!");
      navigate("/login");
    }
  }, [warningCount, navigate]);

  const handleStartExam = (examId: string) => {
    setSelectedExam(examId);
    setShowRules(true);
    setScrollEnd(false);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "default";
      case "missed":
        return "warning";
      case "completed":
        return "secondary";
      case "active":
        return "warning";
      default:
        return "secondary";
    }
  };
  // const navigate = useNavigate();

  const filterExamsByTab = (tab: string) => {
    return upcomingExams.filter((exam) => {
      const category = (exam.category || "").toLowerCase();
      switch (tab) {
        case "tech":
          return category.includes("tech");
        case "nontech":
          return category.includes("non") || category.includes("arts") || category.includes("commerce");
        case "reexam":
          return category.includes("re-exam") || category.includes("retake");
        case "certifications":
          return category.includes("cert") || category.includes("certificate");
        default:
          return true;
      }
    });
  };
  
  
  if (!studentInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

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
                <p className="font-medium text-card-foreground capitalize">{studentInfo.name}</p>
                <p className="text-sm text-muted-foreground">{studentInfo.department}</p>
              </div>
              <div className="p-2 rounded-full bg-primary-light" >
                <User className="h-6 w-6 text-primary" onClick={() => navigate("/student/profile")} />
              </div>
              <Button variant="outline" 
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE}/api/auth/student/logout`, {
                      method: "POST",
                      credentials: "include", // 🔒 Send HttpOnly cookie
                    });

                    if (!res.ok) throw new Error("Logout failed");

                    toast.success("✅ Logged out securely!");
                    setTimeout(() => {
                      localStorage.clear(); // 🧹 remove any local traces
                      sessionStorage.clear();
                      navigate("/login");
                    }, 800);
                  } catch (err) {
                    console.error("Logout Error:", err);
                    toast.error("Logout failed. Please try again.");
                  }
                }}

                >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
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

        <Tabs defaultValue="tech" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tech">Tech</TabsTrigger>
            <TabsTrigger value="nontech">Non-Tech</TabsTrigger>
            <TabsTrigger value="reexam">Re-Exam</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {/* ✅ Conditionally render Certification tab layout */}
            {activeTab === "certifications" ? (
              <div className="mt-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      Your Certifications
                    </CardTitle>
                    <CardDescription>
                      Download certificates for completed courses or exams
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Demo Certificate Data */}
                    {[
                      { id: 1, examName: "Full Stack Web Development", date: "2025-05-10" },
                      { id: 2, examName: "Blockchain Fundamentals", date: "2025-06-21" },
                      { id: 3, examName: "AI & Machine Learning", date: "2025-07-15" },
                    ].map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-card"
                      >
                        <div>
                          <h4 className="font-semibold text-card-foreground">{cert.examName}</h4>
                          <p className="text-sm text-muted-foreground">Issued on {cert.date}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info(`Downloading ${cert.examName} certificate...`)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* ✅ Default Tabs Layout (Tech, Non-Tech, Re-Exam) */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                {/* Upcoming Exams */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Upcoming Exams
                    </CardTitle>
                    <CardDescription>Exams under "{activeTab}" category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[450px] overflow-y-auto scrollbar-thin">
                    {filterExamsByTab(activeTab).map((exam) => (
                      <div key={exam.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-card-foreground mb-1 capitalize">
                              {exam.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {exam.description || "Exam details not available"}
                            </p>
                            {/* <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {exam.startDate}

                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {exam.startTime}
                              </span>
                              <span> to </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {exam.endDate}
                              </span>
                              
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {exam.endTime}
                              </span>
                            </div> */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {exam.startDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {exam.startTime}
                              </span>
                              {/* <span>{exam.duration} mins</span> */}
                              <span> to </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {exam.endDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {exam.endTime}
                              </span> 
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                              {/* <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {exam.endDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {exam.endTime}
                              
                              </span> */}
                              <span>Duration : {exam.duration} mins</span>
                              
                            </div>
                          </div>
                          <Badge variant={getStatusColor(exam.status)}>{exam.status}</Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Subject: {exam.subcategory || exam.subject}
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

                    {filterExamsByTab(activeTab).length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No exams found for this category</p>
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
                    {recentExams.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No completed exams yet</p>
                      </div>
                    ) : (
                      recentExams.map((exam) => (
                        <div key={exam.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-card-foreground mb-1 capitalize">
                                {exam.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {exam.subject} • {exam.date}
                              </p>
                            </div>
                            <Badge variant="secondary">Completed</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Score</span>
                              <span className="font-medium text-card-foreground">
                                {exam.score}/{exam.totalMarks} (
                                {Math.round((exam.score / exam.totalMarks) * 100)}%)
                              </span>
                            </div>
                            <Progress value={(exam.score / exam.totalMarks) * 100} className="h-2" />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

        </Tabs>

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
      {/* 🔒 Exam Rules Popup */}
      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">Exam Rules & Guidelines</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[300px] pr-4">
            <div
              onScrollCapture={(e) => {
                const el = e.currentTarget;
                if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
                  setScrollEnd(true);
                }
              }}
              className="overflow-y-auto max-h-[300px] pr-2"
            >
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm leading-relaxed">
                <li>Ensure you have a stable internet connection before starting the exam.</li>
                <li>Do not refresh, close, or switch tabs during the exam.</li>
                <li>Copying, screenshots, or using external help (AI tools, phones) is strictly prohibited.</li>
                <li>Do not open new applications while the exam is active.</li>
                <li>The system monitors your tab switches and clipboard activity.</li>
                <li>If multiple violations are detected, your exam will be automatically submitted.</li>
                <li>Submit answers carefully before time runs out.</li>
                <li>For any technical issues, contact your invigilator immediately.</li>
                <li>Stay calm and do your best!</li>
              </ul>
            </div>
          </ScrollArea>


          <DialogFooter className="flex justify-end gap-2 mt-4" aria-describedby="dialog-description" id="dialog-desc">
            <Button
              variant="secondary"
              onClick={() => setShowRules(false)}
            >
              Reject
            </Button>
            <Button
              variant="hero"
              disabled={!scrollEnd}
              onClick={() => {
                if (selectedExam) navigate(`/exam/${selectedExam}`);
                setShowRules(false);
              }}
              // onClick={async () => {
              //   if (!selectedExam) return;
              //   try {
              //     await axios.post(`${API_BASE}/api/student/exam/start`, 
              //       { examId: selectedExam },
              //       { withCredentials: true }
              //     );
              //     navigate(`/exam/${selectedExam}`);
              //   } catch(e) {
              //     toast.error("Cannot start exam. Try again.");
              //   }
              //   setShowRules(false);
              // }}
            >
              {scrollEnd ? "Accept & Start Exam" : "Scroll to Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default StudentDashboard;