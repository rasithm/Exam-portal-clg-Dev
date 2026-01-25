
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { baseUrl } from "@/constant/Url";

const API_BASE = baseUrl || "http://localhost:5000";

export default function AdminStudentReportLoader() {
  const { examId, studentId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/admin/reports/${examId}/student/${studentId}/report`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("Not authorized");

        const data = await res.json();

        navigate(data.redirectUrl, { replace: true });
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  return null;
}
