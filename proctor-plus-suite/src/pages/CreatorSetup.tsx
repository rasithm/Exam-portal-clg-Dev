
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Shield, Users, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { baseUrl } from "../constant/Url";

const CreatorSetup = () => {
  const [formData, setFormData] = useState({
    collegeName: "",
    collegeTag: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: ""
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async(e: React.FormEvent) => {
    try{
      e.preventDefault();
    
      if (formData.adminPassword !== formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      if (formData.adminPassword.length < 8) {
        toast({
          title: "Error", 
          description: "Password must be at least 8 characters long",
          variant: "destructive",
        });
        return;
      }

      // Simulate API call
      const token = localStorage.getItem("creatorToken");

      // Navigate to login page
      try {
        const res = await fetch(`${baseUrl}/api/creator/setup`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}`
           },
          body: JSON.stringify(formData),
          credentials: "include"
        });
        const data = await res.json();

        if (res.ok) {
          toast({ title: "Success", description: data.message });
          
          setTimeout(() => navigate("/login"), 1500);
        } else {
          toast({ title: "Error", description: data.message, variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Error", description: "Server not reachable", variant: "destructive" });
        console.log(err)
      }
    }catch(error){
      console.log(`Error : CreatorSetUp ${error}`);
      
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero content */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="p-3 gradient-primary rounded-xl shadow-hero">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">ExamPro</h1>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              Professional Exam Management System
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
              Create a secure, comprehensive examination platform for your educational institution with advanced anti-cheating measures.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-4 rounded-xl bg-card shadow-card">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold text-card-foreground">Secure Testing</h3>
              <p className="text-sm text-muted-foreground text-center">Advanced security measures</p>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-xl bg-card shadow-card">
              <Users className="h-8 w-8 text-secondary mb-2" />
              <h3 className="font-semibold text-card-foreground">Multi-Role</h3>
              <p className="text-sm text-muted-foreground text-center">Admin & student dashboards</p>
            </div>
            
            <div className="flex flex-col items-center p-4 rounded-xl bg-card shadow-card">
              <BookOpen className="h-8 w-8 text-success mb-2" />
              <h3 className="font-semibold text-card-foreground">Auto Grading</h3>
              <p className="text-sm text-muted-foreground text-center">Instant result evaluation</p>
            </div>
          </div>
        </div>

        {/* Right side - Setup form */}
        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set Up Your Institution</CardTitle>
            <CardDescription>
              Create the first admin account for your college
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collegeName">College Name</Label>
                <Input
                  id="collegeName"
                  placeholder="e.g., Stanford University"
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  value={formData.collegeName}
                  onChange={(e) => handleInputChange("collegeName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collegeTag">College Tag/Code</Label>
                <Input
                  id="collegeTag"
                  placeholder="e.g., STAN001"
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  value={formData.collegeTag}
                  onChange={(e) => handleInputChange("collegeTag", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  placeholder="admin@college.edu"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  placeholder="Create a strong password"
                  value={formData.adminPassword}
                  onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                />
              </div>

              <Button type="submit" variant="hero" className="w-full h-12 text-lg">
                Create Admin Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatorSetup;