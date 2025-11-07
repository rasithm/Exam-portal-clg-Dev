import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, ShieldCheck, Lock, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetComplete, setIsResetComplete] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || !password || !confirmPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Simulate success (will connect API later)
    toast({
      title: "Password Reset Successful",
      description: "Your password has been updated. Please login again.",
    });

    setTimeout(() => {
      setIsResetComplete(true);
    }, 800);
  };

  // ✅ Success Page
  if (isResetComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated border-0">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-success-light mx-auto mb-4 w-fit">
              <ShieldCheck className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-4">Password Updated!</h2>
            <p className="text-muted-foreground mb-6">
              You can now log in using your new credentials. For security, please remember your password.
            </p>
            <Button variant="hero" className="w-full" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Verification + Reset Form
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
              Reset Verification
            </h2>
            <p className="text-lg text-muted-foreground">
              Enter the verification code you received and create a new password
            </p>
          </div>

          <div className="hidden lg:block space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-card">
              <Lock className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-card-foreground">Secure Validation</p>
                <p className="text-sm text-muted-foreground">Your password reset is encrypted and private.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Reset form */}
        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify & Reset Password</CardTitle>
            <CardDescription>
              Enter the 6-digit verification code and your new password
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter your 6-digit code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                Make sure your password has at least 8 characters and includes a mix of uppercase, lowercase, and symbols.
              </div>

              <Button type="submit" variant="hero" className="w-full h-12">
                Reset Password
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/forgot-password")}
              >
                <ArrowLeft className="h-4 w-4 mr-2"  />
                Back to Forgot Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetVerification;
