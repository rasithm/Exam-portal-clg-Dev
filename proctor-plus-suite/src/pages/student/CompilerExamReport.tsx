import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  FileBadge,
  User,
  Code,
  Calendar,
  Clock,
  Award,
  ArrowLeft,
} from "lucide-react";
import { Chart, registerables, ChartConfiguration } from "chart.js";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { baseUrl } from "@/constant/Url";
import { useLocation } from "react-router-dom";

const API_BASE = baseUrl || "http://localhost:5000";
// Register Chart.js components
Chart.register(...registerables);

// --- Types & Interfaces ---
interface StudentProfile {
  name: string;
  id: string;
  rollNumber: string;
  department: string;
  year: string;
  collegeName: string;
  examDate: string;
  photoUrl: string;
}

interface ExamStats {
  examName: string;
  language: string;
  duration: number;
  totalQuestions: number;
  attempted: number;
  passed: number;
  partial: number;
  failed: number;
  totalMarks: number;
  maxMarks: number;
}

interface ProctoringData {
  cheatingCount: number;
  cheatingReason: string;
}

interface ReportData {
  reportId: string;
  student: StudentProfile;
  exam: ExamStats;
  proctoring: ProctoringData;
  certificateEligible: boolean;
  certificateId?: string;
}

interface ViolationDetails {
  tabSwitchCount: number;
  fullscreenExitCount: number;
  devToolCount: number;
  shortcutCount: number;
  violationReason: "tab" | "fullscreen" | "devtools" | "shortcut" | null;
}

interface ProctoringData {
  cheatingCount: number;
  cheatingReason: string;
  violationDetails?: ViolationDetails | null;
}


// Dummy data for development
const dummyReportData: ReportData = {
  reportId: "COMP-RPT-2024-001",
  student: {
    name: "John Doe",
    id: "STU2024001",
    rollNumber: "CS2024001",
    department: "Computer Science",
    year: "3rd Year",
    collegeName: "ABC Engineering College",
    examDate: "2024-01-15",
    photoUrl: "",
  },
  exam: {
    examName: "Data Structures & Algorithms - Midterm",
    language: "Python",
    duration: 120,
    totalQuestions: 5,
    attempted: 5,
    passed: 3,
    partial: 1,
    failed: 1,
    totalMarks: 75,
    maxMarks: 100,
  },
  proctoring: {
    cheatingCount: 0,
    cheatingReason: "None",
  },
  certificateEligible: true,
  certificateId: "CERT-DSA-2024-001",
};

const CompilerExamReport: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  // --- State Management ---
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // --- Chart Refs ---
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // --- Derived Metrics ---
  const studentScore = reportData?.exam.totalMarks ?? 0;
  const maxScore = reportData?.exam.maxMarks ?? 0;
  const percentage = maxScore > 0 ? Math.round((studentScore / maxScore) * 100) : 0;

  const cheatingPenalty = reportData ? reportData.proctoring.cheatingCount * 10 : 0;
  const finalPercentage = Math.max(0, percentage - cheatingPenalty);
  const isPassed = finalPercentage >= 50;

  const location = useLocation();
  const hideCertificate = location.state?.from === "report";


  // --- Fetch report data ---
  useEffect(() => {
    const fetchReport = async () => {
      if (!examId) return;

      try {
        setLoading(true);
        // const res = await fetch(
        //   `${API_BASE}/api/student/compiler-exams/${examId}/student-report`,
        //   { credentials: "include" }
        // );
        const params = new URLSearchParams(window.location.search);
        const studentId = params.get("studentId");

        const endpoint = studentId
          ? `${API_BASE}/api/admin/reports/${examId}/student/${studentId}/report-data`
          : `${API_BASE}/api/student/compiler-exams/${examId}/student-report`;

        const res = await fetch(endpoint, {
          credentials: "include",
        });


        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to load report");
        }

        const json: ReportData = await res.json();
        setReportData(json);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [examId]);


  // --- Initialize/Update Chart when data changes ---
  useEffect(() => {
    if (!reportData) return;

    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        const passedPercent = Math.round(
          (reportData.exam.passed / reportData.exam.totalQuestions) * 100
        );
        const partialPercent = Math.round(
          (reportData.exam.partial / reportData.exam.totalQuestions) * 100
        );
        const failedPercent = Math.round(
          (reportData.exam.failed / reportData.exam.totalQuestions) * 100
        );

        const config: ChartConfiguration = {
          type: "bar",
          data: {
            labels: ["Score %", "Passed %", "Partial %", "Failed %"],
            datasets: [
              {
                label: "Value",
                data: [finalPercentage, passedPercent, partialPercent, failedPercent],
                backgroundColor: [
                  "rgba(37, 99, 235, 0.8)", // Blue
                  "rgba(16, 185, 129, 0.6)", // Green
                  "rgba(245, 158, 11, 0.6)", // Amber
                  "rgba(239, 68, 68, 0.6)", // Red
                ],
                borderColor: [
                  "rgba(37, 99, 235, 1)",
                  "rgba(16, 185, 129, 1)",
                  "rgba(245, 158, 11, 1)",
                  "rgba(239, 68, 68, 1)",
                ],
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.5,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.raw}%`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                suggestedMax: 100,
                grid: {
                  color: "#f3f4f6",
                },
              },
              x: {
                grid: {
                  display: false,
                },
              },
            },
          },
        };

        chartInstance.current = new Chart(ctx, config);
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [reportData, finalPercentage]);

  // --- Handlers ---
  const handleDownloadPDF = async () => {
    setPdfDownloaded(true);
    if (!cardRef.current) return;
    
    // Dynamic imports for PDF generation
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const element = cardRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = 210;
    const pdfHeight = 297;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Compiler-Exam-Report-${reportData?.reportId}.pdf`);
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-600">Report not available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      {/* Control Panel */}
      <div className="max-w-[210mm] mx-auto px-4 mb-6 flex justify-between items-center print:hidden">
        <Button
          variant="outline"
          onClick={() => navigate("/student/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <Button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {/* Report Container (A4 Approximation) */}
      <div
        ref={cardRef}
        className="relative max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl rounded-lg overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* 1. Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Code className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Compiler Exam Report
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Programming Assessment Evaluation
                </p>
                <p className="text-blue-200 text-xs mt-2 font-mono">
                  Report ID: {reportData.reportId}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Details Grid */}
        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Student Profile */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Student Profile
            </h3>
            {/* Profile Image - Top Center */}
            <div className="flex justify-center mb-4">
              {reportData.student.photoUrl ? (
                <img
                  src={reportData.student.photoUrl}
                  alt={reportData.student.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                  {reportData.student.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Student Details - Full Width */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Full Name</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {reportData.student.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Roll Number</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {reportData.student.rollNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {reportData.student.department}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Year</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {reportData.student.year}nd Year
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">College</span>
                <span className="font-semibold text-slate-800 text-right max-w-[160px]">
                  {reportData.student.collegeName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exam Date</span>
                <span className="font-semibold text-slate-800 ">
                  {new Date(reportData.student.examDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Exam Summary */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
            <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileBadge className="w-4 h-4" />
              Assessment Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Exam Name</span>
                <span className="font-semibold text-slate-800 text-right max-w-[180px]">
                  {reportData.exam.examName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Language</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {reportData.exam.language}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-800">
                  {reportData.exam.duration} mins
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Questions</span>
                <span className="font-semibold text-slate-800">
                  {reportData.exam.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" /> Passed
                </span>
                <span className="font-semibold text-green-600">
                  {reportData.exam.passed}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> Partial
                </span>
                <span className="font-semibold text-amber-600">
                  {reportData.exam.partial}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-red-500" /> Failed
                </span>
                <span className="font-semibold text-red-600">
                  {reportData.exam.failed}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Proctoring Section */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Integrity & Proctoring Analysis
          </h3>

          {reportData.proctoring.cheatingCount > 0 ? (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-red-700">Irregularities Detected</p>
                  <p className="text-sm text-red-600 mt-1">
                    Flagged for suspicious activity. Review required.
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-slate-700">
                      <span className="font-medium">Flags:</span>{" "}
                      {reportData.proctoring.cheatingCount}
                    </p>
                    <p className="text-slate-700 text-sm">
                      <span className="font-medium">Reason:</span>{" "}
                      {reportData.proctoring.cheatingReason}
                    </p>

                    {reportData.proctoring.violationDetails && (
                      <div className="mt-3 grid grid-cols-4 gap-x-6 gap-y-2 text-sm">
                        <p className="text-slate-700">
                          <span className="font-medium">Tab Switches:</span>{" "}
                          {reportData.proctoring.violationDetails.tabSwitchCount}
                        </p>

                        <p className="text-slate-700">
                          <span className="font-medium">Fullscreen Exits:</span>{" "}
                          {reportData.proctoring.violationDetails.fullscreenExitCount}
                        </p>

                        <p className="text-slate-700">
                          <span className="font-medium">DevTools Attempts:</span>{" "}
                          {reportData.proctoring.violationDetails.devToolCount}
                        </p>

                        <p className="text-slate-700">
                          <span className="font-medium">Shortcut Attempts:</span>{" "}
                          {reportData.proctoring.violationDetails.shortcutCount}
                        </p>

                        {reportData.proctoring.violationDetails.violationReason && (
                          <p className="col-span-2 text-red-700 mt-2">
                            <span className="font-medium">Auto-Trigger Reason:</span>{" "}
                            {reportData.proctoring.violationDetails.violationReason === "tab" &&
                              "Multiple tab switches"}
                            {reportData.proctoring.violationDetails.violationReason === "fullscreen" &&
                              "Repeated fullscreen exits"}
                            {reportData.proctoring.violationDetails.violationReason === "shortcut" &&
                              "Unauthorized keyboard shortcuts"}
                            {reportData.proctoring.violationDetails.violationReason === "devtools" &&
                              "Developer tools access detected"}
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-green-200 bg-green-50 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-700">Verified Session</p>
                  <p className="text-sm text-green-600 mt-1">
                    No irregularities detected. Environment compliant.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Cheating Count: 0
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Visual Analysis (Chart) */}
        <div className="px-6 pb-6">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
            Performance Analytics
          </h3>
          <div className="h-52 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <canvas ref={chartRef}></canvas>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2 italic">
            Figure 1.1: Individual candidate performance breakdown.
          </p>
        </div>

        {/* 5. Footer - Results Summary */}
        <div className="bg-slate-100 border-t border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Final Result
              </p>
              <span
                className={`text-2xl font-bold px-4 py-1 rounded-lg ${
                  isPassed
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isPassed ? "PASSED" : "FAILED"}
              </span>
            </div>

            <div className="flex gap-8 text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Total Score
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {studentScore}{" "}
                  <span className="text-sm text-slate-500">/ {maxScore}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Percentage
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {finalPercentage}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Questions
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {reportData.exam.attempted}{" "}
                  <span className="text-sm text-slate-500">
                    / {reportData.exam.totalQuestions}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Certificate Button */}
          {isPassed && reportData.certificateEligible && !hideCertificate && !pdfDownloaded &&(
            <div className="flex justify-center">
              <Button
                onClick={() =>
                  navigate(`/exam/completed/${reportData.certificateId}`, { state: { from: "student" , examId: examId  } })

                }
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Award className="w-4 h-4" />
                Download Certificate
              </Button>
            </div>
          )}
        </div>

        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <Code className="w-96 h-96 text-slate-900" />
        </div>

        {/* Footer Text */}
        <div className="text-center py-4 border-t border-slate-100 bg-white">
          <p className="text-xs text-slate-400">
            This report is system generated. Date Generated:{" "}
            {new Date().toLocaleString()}
          </p>
          <p className="text-xs text-slate-300 mt-1">
            verify at portal.example.com/verify/{reportData.reportId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompilerExamReport;
