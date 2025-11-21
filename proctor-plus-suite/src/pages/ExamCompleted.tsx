//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\proctor-plus-suite\src\pages\ExamCompleted.tsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  Download, 
  Home, 
  ChevronRight, 
  Award, 
  User, 
  Share2,
  Printer,
  AlertCircle,
  ShieldCheck,
  QrCode,
  FileCheck,
  ExternalLink
} from 'lucide-react';


import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { baseUrl } from "../constant/Url";
const API_BASE = baseUrl || "http://localhost:5000";


// --- Mock Data ---
const MOCK_DATA = {
  student: {
    name: "Alex Johnson",
    id: "STD-2024-8921",
    course: "Bachelor of Technology (C.S.E)",
    semester: "VI Semester, 2025",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    email: "alex.j@university.edu",
    institution: "Global Institute of Technology"
  },
  exam: {
    title: "Advanced Data Structures & Algorithms",
    code: "CS-601",
    session: "OCT-24-S2",
    date: "October 24, 2025",
    time: "10:00 AM - 11:30 AM",
    totalQuestions: 50,
    maxMarks: 100,
    passingMarks: 40
  },
  result: {
    score: 86,
    percentage: 86.00,
    status: "PASSED",
    grade: "A",
    classification: "First Class with Distinction",
    correct: 43,
    wrong: 5,
    skipped: 2,
    timeTaken: "78m 12s",
    percentile: 92.5,
    certificateId: "CERT-8829-1102-XJ"
  }
};

// --- Components ---

const Header = () => (
  <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20 shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <ShieldCheck className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight">EduPortal<span className="text-indigo-400">Verify</span></h1>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Official Result Repository</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-medium text-emerald-400">System Online</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
          <User className="w-4 h-4" />
        </div>
      </div>
    </div>
  </header>
);

const InfoRow = ({ label, value, isMono = false }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-3 border-b border-slate-100 last:border-0">
    <span className="text-slate-500 text-sm font-medium">{label}</span>
    <span className={`text-slate-800 font-semibold text-sm ${isMono ? 'font-mono tracking-tight' : ''} mt-1 sm:mt-0 text-right`}>
      {value}
    </span>
  </div>
);

const CertificateCard = ({ result, student }) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-xl relative overflow-hidden group">
    {/* Background decorative elements */}
    <div className="absolute top-0 right-0 p-4 opacity-5">
      <Award size={140} />
    </div>
    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>

    <div className="relative z-10 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" /> 
            Digital Certificate
          </h3>
          <span className="text-xs bg-white/10 px-2 py-1 rounded font-mono text-slate-300">{result.certificateId}</span>
        </div>
        <p className="text-sm text-slate-300 mb-6">
          This result is digitally signed and verified. You can download the official certificate which contains a QR code linking back to this verification page.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
        <div className="bg-white p-1 rounded">
          <QrCode className="w-12 h-12 text-slate-900" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400 mb-1">Certificate Actions</p>
          <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-md text-sm font-medium transition-all shadow-lg shadow-indigo-900/20">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  </div>
);

const StatBox = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
    <div className={`mt-1 p-2 rounded-lg ${color} bg-opacity-10 flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-slate-800 my-0.5">{value}</p>
      <p className="text-xs text-slate-400 font-medium">{sub}</p>
    </div>
  </div>
);

// --- Main Application ---
const ExamCompleted = () => {
  // const [loading, setLoading] = useState(true);
  // const { student, exam, result } = MOCK_DATA;

  const { certificateId } = useParams<{ certificateId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isStudentView = location.state?.from === "student";
  const examIdFromState = location.state?.examId || null;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/public/certificate/${certificateId}`
        );
        setStudent(res.data.student);
        setExam(res.data.exam);
        setResult(res.data.result);
      } catch (err) {
        console.error("Certificate view error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (certificateId) fetchData();
  }, [certificateId]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
    </div>
  );

  if (!student || !exam || !result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 text-sm">
          Certificate not found or data unavailable.
        </p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12 selection:bg-indigo-100">
      <Header />

      {/* Verification Strip */}
      <div className="bg-emerald-600 text-white text-xs font-medium text-center py-1.5 shadow-inner">
        <span className="flex items-center justify-center gap-2">
          <CheckCircle className="w-3 h-3" />
          OFFICIAL RECORD: This result is digitally verified and stored in the university ledger.
        </span>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Student Identity & Certificate */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* ID Card Style Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-indigo-600 to-blue-600 relative">
                 <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                    <div className="p-1 bg-white rounded-full shadow-md">
                      <img 
                        src={student.avatarUrl} 
                        alt={student.name} 
                        className="w-24 h-24 rounded-full object-cover border-2 border-slate-100"
                      />
                    </div>
                 </div>
              </div>
              <div className="pt-14 pb-6 px-6 text-center">
                <h2 className="text-xl font-bold text-slate-800 capitalize">{student.name}</h2>
                <p className="text-indigo-600 font-medium text-sm mb-4">{student.id}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Verified Student
                </div>
                
                <div className="border-t border-slate-100 pt-4 text-left space-y-3">
                   <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-slate-400"><User size={14} /></div>
                      <div>
                        <p className="text-xs text-slate-500">Course</p>
                        <p className="text-sm font-semibold text-slate-700">{student.course}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-slate-400"><Calendar size={14} /></div>
                      <div>
                        <p className="text-xs text-slate-500">Session</p>
                        <p className="text-sm font-semibold text-slate-700">{exam.session}</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Certificate Download Section (Sidebar) */}
            <CertificateCard result={result} student={student} />
          </div>

          {/* Right Content: Exam Result & Details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Main Result Banner */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="text-center md:text-left flex-1">
                   <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">
                        {exam.code}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-xs font-semibold text-slate-500 uppercase">{exam.date}</span>
                   </div>
                   <h2 className="text-2xl font-bold text-slate-900 mb-2 capitalize">{exam.title}</h2>
                   <p className="text-slate-500 text-sm mb-6">
                     Completed in {result.timeTaken} • {exam.maxMarks} Total Marks
                   </p>
                   
                   <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                         <p className="text-xs text-emerald-600 font-bold uppercase">Status</p>
                         <p className="text-lg font-bold text-emerald-700">{result.status}</p>
                      </div>
                      <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg">
                         <p className="text-xs text-slate-500 font-bold uppercase">Grade</p>
                         <p className="text-lg font-bold text-slate-700">{result.grade}</p>
                      </div>
                      <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                         <p className="text-xs text-indigo-500 font-bold uppercase">Percentile</p>
                         <p className="text-lg font-bold text-indigo-700">{result.percentile}%</p>
                      </div>
                   </div>
                </div>

                {/* Circular Score */}
                <div className="relative">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                    <circle cx="80" cy="80" r="70" stroke="#10b981" strokeWidth="10" fill="transparent" 
                      strokeDasharray={439.8} strokeDashoffset={439.8 - (439.8 * result.percentage) / 100} 
                      strokeLinecap="round" className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-800">{result.score}</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <StatBox 
                label="Accuracy" 
                value={`${result.percentage}%`} 
                sub={`${result.correct}/${result.correct + result.wrong} Correct`}
                icon={CheckCircle} 
                color="bg-emerald-500"
              />
              <StatBox 
                label="Time Efficiency" 
                value="86%" 
                sub="Avg 1.5m / question"
                icon={Clock} 
                color="bg-blue-500"
              />
              <StatBox 
                label="Class Rank" 
                value="Top 8%" 
                sub="12th out of 150"
                icon={Award} 
                color="bg-amber-500"
              />
            </div>

            {/* Tabular Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Performance Breakdown</h3>
                  <button className="text-indigo-600 text-xs font-semibold hover:underline flex items-center gap-1">
                     View Question Paper <ExternalLink size={12} />
                  </button>
               </div>
               <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                  <InfoRow label="Total Questions" value={exam.totalQuestions} />
                  <InfoRow label="Correct Answers" value={result.correct} />
                  <InfoRow label="Incorrect Answers" value={result.wrong} />
                  <InfoRow label="Skipped Questions" value={result.skipped} />
                  <InfoRow label="Grace Mark" value="0" />
                  <InfoRow label="Final Score" value={`${result.score} / ${exam.maxMarks}`} isMono={true} />
               </div>
               <div className="bg-amber-50 px-6 py-3 border-t border-amber-100 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Note:</strong> This is a computer-generated provisional result. The final physical certificate marksheet will be issued by the {MOCK_DATA.student.institution} registrar office within 14 working days.
                  </p>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end mt-4">
              {isStudentView && (
                <>
                  <button
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      if (examIdFromState) {
                        navigate(`/student/exam/report/${examIdFromState}`);
                      }
                    }}
                  >
                    <FileCheck className="w-4 h-4" /> View Report
                  </button>

                  <button
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors shadow-lg shadow-slate-900/10"
                    onClick={() => navigate("/student/dashboard")}
                  >
                    Return to Dashboard <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>


          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamCompleted;