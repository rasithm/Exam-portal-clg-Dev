// src/pages/OtpVerification.tsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { baseUrl } from "../constant/Url";
const API = baseUrl || "http://localhost:5000";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const OtpVerification = () => {
  const query = useQuery();
  const role = query.get("role");
  const requestId = query.get("req");
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(false);
  

  const handleVerify = async (e: React.FormEvent) => {
    setVerifying(true);
    e.preventDefault();
    if (!otp) return toast({ title: "Enter OTP", variant: "destructive" });

    try {
      
      if (role === "admin" && query.get("type") === "forgot") {
        // 🔹 ADMIN FORGOT PASSWORD FLOW
        const res = await fetch(`${API}/api/forgot/admin/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId, otp }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message);

        navigate(`/reset/complete?role=admin&req=${requestId}&token=${encodeURIComponent(json.oneTimeToken)}`);
      } else if (role === "admin") {
        const res = await fetch(`${API}/api/admin/verify-email/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ requestId, otp })
        });


        const json = await res.json();
        if (!res.ok) throw new Error(json.message);

        const pending = JSON.parse(sessionStorage.getItem("pendingAdminProfileUpdate") || "{}");

        const formData = new FormData();
        formData.append("name", pending.name);
        formData.append("phone_no", pending.phone_no);
        formData.append("whatsapp_no", pending.whatsapp_no || "");
        formData.append("personalEmail", pending.personalemail);
        const imageData = sessionStorage.getItem("pendingProfileImage");

        if (imageData) {
          const blob = await fetch(imageData).then(r => r.blob());
          formData.append("profileImage", blob, "profile.png");
        }


        await fetch(`${API}/api/admin/profile`, {
          method: "PUT",
          credentials: "include",
          body: formData
        });

        
        toast({ title: "Profile Updated" });
        navigate("/admin/profile");
      }

      else{
        const res = await fetch(`${API}/api/forgot/student/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ requestId, otp }),
        });
        const json = await res.json();
        if (!res.ok) {
          return toast({ title: "Error", description: json.message || "Invalid OTP", variant: "destructive" });
        }
        // get oneTimeToken and navigate to ResetVerification
        const token = json.oneTimeToken;
        toast({ title: "OTP Verified", description: "Proceed to reset password" });
        navigate(`/reset/complete?role=student&req=${requestId}&token=${encodeURIComponent(token)}`);
        
      }
      
      
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Server error", variant: "destructive" });
    }finally {
      setVerifying(false);
    }
  };

  if (role !== "admin" && !requestId) {
    return <div className="p-8 text-center">Invalid request</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Enter OTP</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label>OTP</Label>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={verifying}>
              {verifying ? "Verifying..." : "Verify OTP"}
            </Button>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtpVerification;
