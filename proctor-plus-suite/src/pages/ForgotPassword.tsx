import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ArrowLeft, Mail, Shield, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [adminEmail, setAdminEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAdminReset = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminEmail) {
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions",
      });
      setIsSubmitted(true);
    } else {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
    }
  };

  const handleStudentReset = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (studentId) {
      toast({
        title: "Request Submitted",
        description: "Contact your administrator for password reset assistance",
      });
      setIsSubmitted(true);
    } else {
      toast({
        title: "Error",
        description: "Please enter your student ID",
        variant: "destructive",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated border-0">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-success-light mx-auto mb-4 w-fit">
              <Mail className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-4">Request Submitted</h2>
            <p className="text-muted-foreground mb-6">
              We've received your password reset request. Please check your email or contact your administrator.
            </p>
            <div className="space-y-3">
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Back to Login
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsSubmitted(false)}
              >
                Submit Another Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Password Recovery
            </h2>
            <p className="text-lg text-muted-foreground">
              Reset your password to regain access to your examination platform
            </p>
          </div>

          <div className="hidden lg:block space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-card">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">Secure Recovery</p>
                <p className="text-sm text-muted-foreground">Safe and encrypted password reset process</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Reset forms */}
        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Choose your account type to reset your password
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
                <form onSubmit={handleAdminReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email Address</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@college.edu"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      A password reset link will be sent to your registered email address. 
                      This link will expire in 24 hours for security purposes.
                    </p>
                  </div>

                  <Button type="submit" variant="hero" className="w-full h-12">
                    Send Reset Link
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="student">
                <form onSubmit={handleStudentReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-id">Student ID</Label>
                    <Input
                      id="student-id"
                      placeholder="Enter your student ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                  </div>

                  <div className="p-4 bg-warning-light rounded-lg">
                    <p className="text-sm text-warning-dark">
                      <strong>Note:</strong> Students cannot reset passwords directly. 
                      Your request will be forwarded to the administrator who will assist you with password recovery.
                    </p>
                  </div>

                  <Button type="submit" variant="secondary" className="w-full h-12">
                    Request Password Reset
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;