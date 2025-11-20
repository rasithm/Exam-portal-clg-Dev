// C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\proctor-plus-suite\src\pages\StudentReport.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Shuffle,
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  FileBadge,
} from "lucide-react";
import { Chart, registerables, ChartConfiguration } from "chart.js";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { baseUrl } from "../constant/Url";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";


// Register Chart.js components
Chart.register(...registerables);

const API_BASE = baseUrl || "http://localhost:5000";

// --- Types & Interfaces ---
interface StudentProfile {
  name: string;
  id: string;
  batch: string;
  examDate: string;
  photoUrl: string;
}

interface ExamStats {
  examName: string;
  totalQs: number;
  correct: number;
  wrong: number;
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
}

const ExamReport: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const location = useLocation();
  const studentAverage = location.state?.averageScore || 0;

  // --- State Management ---
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // --- Chart Refs ---
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // --- Derived Metrics (safe defaults when no data yet) ---
  const marksPerQ = 2;
  const maxScore = reportData ? reportData.exam.totalQs * marksPerQ : 0;
  const studentScore = reportData ? reportData.exam.correct * marksPerQ : 0;
  const percentage =
    maxScore > 0 ? Math.round((studentScore / maxScore) * 100) : 0;
  


  const cheatingPenalty = reportData ? reportData.proctoring.cheatingCount * 10 : 0; 
    const finalPercentage = Math.max(0, percentage - cheatingPenalty);
    const isPassed = finalPercentage >= 50;

  // --- Fetch report data from backend ---
  useEffect(() => {
    const fetchReport = async () => {
      if (!examId) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/api/student/exams/${examId}/student-report`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || "Failed to load report");
        }

        const json: ReportData = await res.json();
        setReportData(json);
      } catch (err: any) {
        console.error("Student report load error:", err);
        toast.error(err.message || "Failed to load report");
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
      // Destroy existing chart to prevent memory leaks/canvas reuse errors
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        const correctPercent = Math.round((reportData.exam.correct / reportData.exam.totalQs) * 100);
        const wrongPercent = Math.round((reportData.exam.wrong / reportData.exam.totalQs) * 100);
        const config: ChartConfiguration = {
          type: "bar",
          data: {
            labels: ["Score %", "Correct %", "Wrong %"],
            datasets: [
              {
                label: "Value",
                

                data: [
                    finalPercentage,   // score after cheating penalty
                    correctPercent,
                    wrongPercent,
                ],


                backgroundColor: [
                  "rgba(37, 99, 235, 0.8)", // Blue
                  "rgba(16, 185, 129, 0.6)", // Green
                  "rgba(239, 68, 68, 0.6)", // Red
                ],
                borderColor: [
                  "rgba(37, 99, 235, 1)",
                  "rgba(16, 185, 129, 1)",
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
                  label: (context) => `${context.raw}`,
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

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [reportData, studentScore]);

  // --- Handlers ---
  const handlePrint = async () => {
    if (!cardRef.current) return;

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

    pdf.save(`Exam-Report-${reportData?.reportId}.pdf`);
    };


  // Optional debug / demo only – you can remove in production
  const randomizeData = () => {
    if (!reportData) return;
    const names = ["Alex", "Jordan", "Taylor", "Casey", "Morgan"];
    const randomName = names[Math.floor(Math.random() * names.length)];

    const total = reportData.exam.totalQs || 50;
    const correct = Math.floor(Math.random() * 30) + 20; // 20-50
    const wrong = total - correct;
    const hasCheated = Math.random() < 0.2;

    setReportData((prev) =>
      prev
        ? {
            ...prev,
            student: {
              ...prev.student,
              name: `${randomName} Doe`,
              photoUrl: prev.student.photoUrl, // keep backend photo or you can randomize avatar
            },
            exam: {
              ...prev.exam,
              correct,
              wrong,
            },
            proctoring: {
              cheatingCount: hasCheated
                ? Math.floor(Math.random() * 5) + 1
                : 0,
              cheatingReason: hasCheated
                ? "Tab switching detected (30s), Face not visible"
                : "None",
            },
          }
        : prev
    );
  };

  // --- Loading / error states ---
  if (loading && !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-muted-foreground">Loading report...</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500">Report not available.</p>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex flex-col items-center print:bg-white print:p-0">
      {/* Control Panel - Hidden on Print */}
      <div className="w-full max-w-[210mm] flex justify-end mb-4 gap-2 print:hidden">
        {/* <button
          onClick={randomizeData}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        >
          <Shuffle className="w-4 h-4 mr-2" />
          Randomize Data
        </button> */}
        <Button variant="outline" onClick={() => navigate("/student/dashboard")}>
                Back to Dashboard
        </Button>
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </button>
      </div>

      {/* Report Container (A4 Approximation) – this is what will be in the PDF */}
      <div
        ref={cardRef}
        id="report-card"
        className="w-full max-w-[210mm] bg-white min-h-[297mm] p-8 relative rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none print:w-full print:max-w-none"
      >
        {/* 1. Header Section */}
        <header className="flex justify-between items-center border-b-4 border-blue-900 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-900 rounded flex items-center justify-center text-white">
              <GraduationCap size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight uppercase">
                Aasaan Tech Academy
              </h1>
              <p className="text-sm text-gray-500">Excellence in Evaluation</p>
              <p className="text-xs text-gray-400 mt-1">
                Report ID: {reportData.reportId}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="w-24 h-24 rounded-full border-4 border-gray-100 overflow-hidden shadow-sm inline-block">
              <img
                src={
                  reportData.student.photoUrl ||
                  "https://api.dicebear.com/9.x/avataaars/svg?seed=Student"
                }
                alt="Student"
                className="w-full h-full object-cover bg-gray-100"
              />
            </div>
          </div>
        </header>

        {/* 2. Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:grid-cols-2">
          {/* Student Profile */}
          <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-blue-500 print:bg-gray-50">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">
              Student Profile
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-600 font-medium">Full Name</span>
                <span className="text-gray-900 font-bold capitalize">
                  {reportData.student.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-600 font-medium">Enrollment ID</span>
                <span className="text-gray-900 font-bold">
                  {reportData.student.id}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-600 font-medium">Batch/Group</span>
                <span className="text-gray-900">
                  {reportData.student.batch}
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-gray-600 font-medium">Exam Date</span>
                <span className="text-gray-900">
                  {reportData.student.examDate}
                </span>
              </div>
            </div>
          </div>

          {/* Exam Summary */}
          <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-indigo-500 print:bg-gray-50">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">
              Assessment Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-600 font-medium">Exam Name</span>
                <span className="text-indigo-900 font-bold capitalize">
                  {reportData.exam.examName}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-gray-600 font-medium">
                  Total Questions
                </span>
                <span className="text-gray-900">
                  {reportData.exam.totalQs}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-green-600 font-medium flex items-center">
                  <CheckCircle size={14} className="mr-1" /> Correct
                </span>
                <span className="text-green-700 font-bold">
                  {reportData.exam.correct}
                </span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-red-600 font-medium flex items-center">
                  <XCircle size={14} className="mr-1" /> Incorrect
                </span>
                <span className="text-red-700 font-bold">
                  {reportData.exam.wrong}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Proctoring Section */}
        <div className="mb-8 p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <ShieldCheck className="mr-2 text-blue-600" size={20} />
            Integrity & Proctoring Analysis
          </h3>

          {reportData.proctoring.cheatingCount > 0 ? (
            <div className="flex items-start gap-4 p-3 rounded bg-red-50 border border-red-200 print:bg-red-50 print:border-red-200">
              <div className="mt-1 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-red-800">Irregularities Detected</h4>
                <p className="text-sm text-red-700">
                  Flagged for suspicious activity. Review required.
                </p>
                <div className="mt-2 space-y-1">
                  <div className="text-xs font-bold text-red-900">
                    Flags: {reportData.proctoring.cheatingCount}
                  </div>
                  <div className="text-xs italic text-red-800">
                    Reason: {reportData.proctoring.cheatingReason}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 p-3 rounded bg-green-50 border border-green-200 print:bg-green-50 print:border-green-200">
              <div className="mt-1 text-green-600">
                <CheckCircle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-green-800">Verified Session</h4>
                <p className="text-sm text-green-700">
                  No irregularities detected. Environment compliant.
                </p>
                <div className="mt-2 text-xs text-green-800 font-mono bg-green-100 inline-block px-2 py-1 rounded print:bg-green-100">
                  Cheating Count: 0
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Visual Analysis (Chart) */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">
            Performance Analytics
          </h3>
          <div className="w-full h-64 bg-white border border-gray-100 rounded p-2">
            <canvas ref={chartRef} />
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">
            Figure 1.1: Individual candidate performance breakdown.
          </p>
        </div>

        {/* 5. Footer */}
        <footer className="mt-auto bg-gray-900 text-white p-6 rounded-lg flex flex-col md:flex-row justify-between items-center shadow-lg print:bg-gray-900 print:text-white">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">
              Final Result
            </p>
            <h2
              className={`text-3xl font-bold ${
                isPassed ? "text-green-400" : "text-red-400"
              }`}
            >
              {isPassed ? "PASSED" : "FAILED"}
            </h2>
          </div>

          <div className="flex gap-8 text-center">
            <div>
              <p className="text-gray-400 text-xs">Total Score</p>
              <p className="text-2xl font-bold">
                {studentScore} / {maxScore}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Percentage</p>
              <p className="text-2xl font-bold text-yellow-400">
                {finalPercentage}%
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Percentile</p>
              <p className="text-xl font-bold text-blue-300">{studentAverage}% Avg</p>
            </div>
          </div>
        </footer>

        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none print:opacity-10">
          <FileBadge size={200} className="text-gray-900" />
        </div>

        <div className="text-center mt-8 text-xs text-gray-400">
          <p>
            This report is system generated by Apex Testing Solutions. Date
            Generated: {new Date().toLocaleString()}
          </p>
          <p>verify at apextesting.com/verify/{reportData.reportId}</p>
        </div>
      </div>
    </div>
  );
};

export default ExamReport;
