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
  const requestId = query.get("req");
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast({ title: "Enter OTP", variant: "destructive" });

    try {
      const res = await fetch(`${API}/api/forgot/student/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        return toast({ title: "Error", description: json.message || "Invalid OTP", variant: "destructive" });
      }
      // get oneTimeToken and navigate to ResetVerification
      const token = json.oneTimeToken;
      toast({ title: "OTP Verified", description: "Proceed to reset password" });
      navigate(`/reset/complete?req=${requestId}&token=${encodeURIComponent(token)}`);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Server error", variant: "destructive" });
    }
  };

  if (!requestId) {
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
            <Button type="submit" className="w-full">Verify OTP</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtpVerification;
