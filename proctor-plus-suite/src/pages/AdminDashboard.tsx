import { useState } from "react";
import CreateStudent from "@/components/CreateStudent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  FileText, 
  Settings, 
  Calendar, 
  BarChart3, 
  AlertTriangle,
  Plus,
  Download,
  Upload
} from "lucide-react";

const AdminDashboard = () => {
  const [stats] = useState({
    totalStudents: 247,
    activeExams: 3,
    completedExams: 15,
    violations: 2
  });

  const [recentExams] = useState([
    { id: 1, title: "Computer Science Midterm", students: 45, date: "2024-01-15", status: "active" },
    { id: 2, title: "Mathematics Final", students: 32, date: "2024-01-12", status: "completed" },
    { id: 3, title: "Physics Quiz", students: 28, date: "2024-01-10", status: "completed" }
  ]);

  const [recentStudents] = useState([
    { id: 1, name: "John Smith", studentId: "CS2024001", email: "john@college.edu", status: "active" },
    { id: 2, name: "Sarah Johnson", studentId: "CS2024002", email: "sarah@college.edu", status: "active" },
    { id: 3, name: "Mike Chen", studentId: "CS2024003", email: "mike@college.edu", status: "inactive" }
  ]);

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
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Exams */}
              <Card className="shadow-card">
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
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule New Exam
                  </Button>
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
                      <p className="text-sm text-muted-foreground">{student.studentId} • {student.email}</p>
                    </div>
                    <Badge variant={student.status === "active" ? "default" : "secondary"}>
                      {student.status}
                    </Badge>
                  </div>
                ))}
                <CreateStudent />
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
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Excel
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
                          <p className="text-sm text-muted-foreground">{student.studentId} • {student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={student.status === "active" ? "default" : "secondary"}>
                          {student.status}
                        </Badge>
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Reset Password</Button>
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
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Student List
                    </Button>
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
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Questions
                    </Button>
                    <Button variant="hero">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Exam
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Exam Creation</h3>
                  <p className="text-muted-foreground mb-4">Design secure exams with multiple question types and anti-cheating measures</p>
                  <Button variant="hero">Create Your First Exam</Button>
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
                    <CardDescription>Download exam results and system analytics</CardDescription>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground mb-4">View detailed reports on exam performance and system usage</p>
                  <Button variant="hero">View Reports</Button>
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