//C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\proctor-plus-suite\src\App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route , Navigate  } from "react-router-dom";
import Index from "./pages/Index";
import CreatorSetup from "./pages/CreatorSetup";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ExamInterface from "./pages/ExamInterface";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import ExamCompleted from "./pages/ExamCompleted";
import Profile from "./pages/Profile";
import ResetVerification from "./pages/ResetVerification";
import ExamResultPage from "./pages/ExamResultPage";
import ExamReport from "./pages/StudentReport";
import OtpVerification from "./pages/OtpVerification";
import AdminProfile from "./pages/AdminProfile";
import CreateCompilerExam from "./pages/admin/CreateCompilerExam";
import CreateCompilerQuestion from "./pages/admin/CreateCompilerQuestion";
import CompilerExam from "./pages/student/CompilerExam";
import CompilerExamStudentResult from "./pages/student/CompilerExamStudentResult";
import CompilerExamReport from "./pages/student/CompilerExamReport";
import AdminStudentReportLoader from "./pages/admin/AdminStudentReportLoader";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/setup" element={localStorage.getItem("creatorToken") ? <CreatorSetup/> : <Navigate to="/login"/>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<Profile />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/exam/:examId" element={<ExamInterface />} />
          <Route path="/student/exam/result/:examId" element={<ExamResultPage />} />
          <Route path="/exam/completed/:certificateId" element={<ExamCompleted />} />
          <Route path="/student/exam/report/:examId" element={<ExamReport />} />
          <Route path="/student/exam/compiler/:examId/report" element={<CompilerExamReport />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset/verify" element={<OtpVerification />} />
          <Route path="/reset/complete" element={<ResetVerification />} />
          <Route path="/admin/exam/create/compiler" element={<CreateCompilerExam />} />
          <Route path="/admin/exam/compiler/question/:id" element={<CreateCompilerQuestion />} />
          <Route path="/student/exam/compiler/:examId" element={<CompilerExam />} />
          <Route path="/student/compiler-exams/:examId/result" element={<CompilerExamStudentResult />} />
          <Route path="/admin/report-view/:examId/:studentId"  element={<AdminStudentReportLoader />}/>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
