//C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\proctor-plus-suite\src\pages\Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, GraduationCap, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff ,Loader2 } from "lucide-react";
import { baseUrl } from "../constant/Url";


const Login = () => {
  const [adminCredentials, setAdminCredentials] = useState({
    email: "",
    password: ""
  });

  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  
  const [studentCredentials, setStudentCredentials] = useState({
    studentId: "",
    password: ""
  });
  
  const [adminLoading, setAdminLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  // const handleAdminLogin = (e: React.FormEvent) => {
  //   e.preventDefault();
    
    
  //   if (adminCredentials.email && adminCredentials.password) {
  //     toast({
  //       title: "Admin Login Successful",
  //       description: "Welcome to your admin dashboard",
  //     });
  //     navigate("/admin/dashboard");
  //   } else {
  //     toast({
  //       title: "Error",
  //       description: "Please fill in all fields",
  //       variant: "destructive",
  //     });
  //   }
  // };
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showAdminPassword) {
      toast({
        title: "Security Alert",
        description: "Hide your password before logging in",
        variant: "destructive",
      });
      return;
    }
    setAdminLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminCredentials),
        credentials: "include" // allows cookies
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.message === "Admin not found") {
          toast({ title: "Error", description: "Email is not registered", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "Email or password is invalid", variant: "destructive" });
        }
        return;
      }

      if (res.ok) {
        if (data.role === "creator") {
          localStorage.setItem("creatorToken", data.token);
          navigate("/setup"); // 🔥 Creator goes to setup page
        } else if (data.role === "admin"){
          navigate("/admin/dashboard");
        }
        toast({ title: "Login Success", description: `Welcome ${data.role}` });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Server not reachable", variant: "destructive" });
    } finally {
      setAdminLoading(false);
    }
  };


  // const handleStudentLogin = (e: React.FormEvent) => {
  //   e.preventDefault();
    
    
  //   if (studentCredentials.studentId && studentCredentials.password) {
  //     toast({
  //       title: "Student Login Successful", 
  //       description: "Welcome to your student dashboard",
  //     });
  //     navigate("/student/dashboard");
  //   } else {
  //     toast({
  //       title: "Error",
  //       description: "Please fill in all fields",
  //       variant: "destructive",
  //     });
  //   }
  // };
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showStudentPassword) {
      toast({
        title: "Security Alert",
        description: "Hide your password before logging in",
        variant: "destructive",
      });
      return;
    }
    setStudentLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/student/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentCredentials),
        credentials: "include"
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.message === "Student not found") {
          toast({ title: "Error", description: "Register number not assigned. Contact admin", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "Register number or password is invalid", variant: "destructive" });
        }
        return;
      }

      if (res.ok) {
        toast({ title: "Login Success", description: "Welcome Student" });
        navigate("/student/dashboard");
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Server not reachable", variant: "destructive" });
    }finally {
      setStudentLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Branding */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="p-3 gradient-primary rounded-xl shadow-hero">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">ExamPro</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Welcome Back
            </h2>
            <p className="text-lg text-muted-foreground">
              Sign in to access your secure examination platform
            </p>
          </div>

          <div className="hidden lg:block space-y-4">
            {/* <div className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-card">
              
                <Code className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium text-card-foreground">Developer Tools</p>
                  <p className="text-sm text-muted-foreground">End-to-end encrypted authentication</p>
                </div>
              
              
            </div> */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-card">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">Secure Access</p>
                <p className="text-sm text-muted-foreground">End-to-end encrypted authentication</p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Right side - Login forms */}
        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Choose your account type to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="student" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Student
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email Address</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      onPaste={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      placeholder="admin@college.edu"
                      value={adminCredentials.email}
                      onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  {/* <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      onPaste={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      placeholder="Enter your password"
                      value={adminCredentials.password}
                      onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div> */}
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showAdminPassword ? "text" : "password"}
                        onPaste={(e) => e.preventDefault()}
                        onDrop={(e) => e.preventDefault()}
                        placeholder="Enter your password"
                        value={adminCredentials.password}
                        onChange={(e) =>
                          setAdminCredentials((prev) => ({ ...prev, password: e.target.value }))
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2 text-muted-foreground"
                        onClick={() => setShowAdminPassword((prev) => !prev)}
                      >
                        {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>


                  {/* <Button type="submit" variant="hero" className="w-full h-12">
                    Sign In as Admin
                  </Button> */}
                  <Button type="submit" variant="hero" className="w-full h-12" disabled={adminLoading}>
                    {adminLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Sign In as Admin"}
                  </Button>

                </form>
              </TabsContent>

              <TabsContent value="student">
                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      placeholder="Enter your student ID"
                      onPaste={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      value={studentCredentials.studentId}
                      onChange={(e) => setStudentCredentials(prev => ({ ...prev, studentId: e.target.value }))}
                      required
                    />
                  </div>

                  {/* <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <Input
                      id="student-password"
                      type="password"
                      onPaste={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      placeholder="Enter your password"
                      value={studentCredentials.password}
                      onChange={(e) => setStudentCredentials(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div> */}
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="student-password"
                        type={showStudentPassword ? "text" : "password"}
                        onPaste={(e) => e.preventDefault()}
                        onDrop={(e) => e.preventDefault()}
                        placeholder="Enter your password"
                        value={studentCredentials.password}
                        onChange={(e) =>
                          setStudentCredentials((prev) => ({ ...prev, password: e.target.value }))
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2 text-muted-foreground"
                        onClick={() => setShowStudentPassword((prev) => !prev)}
                      >
                        {showStudentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>


                  {/* <Button type="submit" variant="secondary" className="w-full h-12">
                    Sign In as Student
                  </Button> */}
                  <Button type="submit" variant="secondary" className="w-full h-12" disabled={studentLoading}>
                    {studentLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Sign In as Student"}
                  </Button>

                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forget Password
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;