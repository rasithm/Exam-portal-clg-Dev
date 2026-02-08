import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Mail, Shield, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { baseUrl } from "../constant/Url";

const API = baseUrl || "http://localhost:5000";

const StudentEmailRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [regNo, setRegNo] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* ---------------- FETCH STUDENT INFO ---------------- */
  const fetchStudent = async () => {
    if (!regNo) return;

    try {
      const res = await fetch(`${API}/api/student/info/${regNo}`);
      const json = await res.json();

      if (!res.ok) {
        toast({ title: "Not Found", description: json.message, variant: "destructive" });
        return;
      }

      setStudent(json);
    } catch {
      toast({ title: "Server Error", variant: "destructive" });
    }
  };

  /* ---------------- SUBMIT REQUEST ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newEmail !== confirmEmail) {
      toast({ title: "Emails do not match", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/student/email-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNo, newEmail }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: json.message, variant: "destructive" });
        return;
      }

      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- SUCCESS SCREEN ---------------- */
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-secondary-light p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8 space-y-4">
            <Mail className="h-10 w-10 mx-auto text-success" />
            <h2 className="text-2xl font-bold">Request Sent</h2>
            <p className="text-muted-foreground">
              Your administrator will review your email update request.
            </p>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------------- MAIN PAGE ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center p-4">

      <div className="w-full max-w-lg space-y-6">

        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 gradient-primary rounded-xl">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">ExamPro</h1>
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle>Email Recovery</CardTitle>
            <CardDescription>
              Add or update your registered email address
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Register number */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Register Number"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                />
                <Button type="button" onClick={fetchStudent}>
                  Verify
                </Button>
              </div>

              {/* Student info */}
              {student && (
                <div className="p-4 rounded-lg bg-muted/40 space-y-2 text-sm">
                  <p><b>Name:</b> {student.name}</p>
                  <p><b>Reg No:</b> {student.rollNumber}</p>
                  <p><b>Department:</b> {student.department}</p>
                  <p><b>Current Email:</b> {student.email || "Not set"}</p>
                </div>
              )}

              {/* Email fields */}
              {student && (
                <>
                  <div>
                    <Label>New Email</Label>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Confirm Email</Label>
                    <Input
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="p-3 bg-warning-light rounded-lg text-sm">
                    <Shield className="inline mr-2 h-4 w-4" />
                    Admin approval required for security.
                  </div>

                  <Button className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : "Request Email Update"}
                  </Button>
                </>
              )}
            </form>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentEmailRequest;
