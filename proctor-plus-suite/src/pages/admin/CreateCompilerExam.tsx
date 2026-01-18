//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\pages\admin\CreateCompilerExam.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/uis/button";
import { Input } from "@/components/uis/input";
import { Label } from "@/components/uis/label";
import { Textarea } from "@/components/uis/textarea";
import { Checkbox } from "@/components/uis/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/uis/card";
import { ArrowLeft, FileCode2, Clock, Calendar, Award, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LanguageIcon } from "@/components/compiler/LanguageIcons";
import axios from 'axios';
import { baseUrl } from "@/constant/Url";

const API_BASE = baseUrl || "http://localhost:5000";
// Language config with VSCode-style icons
const languageConfig = [
  { name: "Python", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600" },
  { name: "Java", color: "bg-orange-500/10 border-orange-500/30 text-orange-600" },
  { name: "C", color: "bg-slate-500/10 border-slate-500/30 text-slate-600" },
  { name: "C++", color: "bg-blue-500/10 border-blue-500/30 text-blue-600" },
  { name: "C#", color: "bg-purple-500/10 border-purple-500/30 text-purple-600" },
  { name: "JavaScript", color: "bg-amber-500/10 border-amber-500/30 text-amber-600" },
  { name: "TypeScript", color: "bg-sky-500/10 border-sky-500/30 text-sky-600" },
  { name: "Kotlin", color: "bg-pink-500/10 border-pink-500/30 text-pink-600" },
  { name: "SQL", color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" }
];


export default function CreateCompilerExam() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    duration: 60,
    selectedLanguage: "",
    questionCount: 1,
    totalMarks: 100,
    description: "",
    startDate: "",
    endDate: "",
    generateCertificate: false,
  });

  // Force light mode on this page
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    return () => {
      // Cleanup not needed - next page will set its own mode
    };
  }, []);
  useEffect(() => {
    const savedDraft = localStorage.getItem("compilerExamDraft");
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
      } catch {}
    }
  }, []);


  const selectLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedLanguage: prev.selectedLanguage === lang ? "" : lang,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // const {
    //   title, selectedLanguage, questionCount, totalMarks, description, startDate, endDate, duration, generateCertificate
    // } = formData;

    if (!formData.title.trim()) {
      return toast({ title: "Error", description: "Please enter exam title", variant: "destructive" });
    }
    if (!formData.selectedLanguage) {
      return toast({ title: "Error", description: "Please select a compiler language", variant: "destructive" });
    }
    if (formData.questionCount < 1) {
      return toast({ title: "Error", description: "Question count must be at least 1", variant: "destructive" });
    }

    try {
      // const payload = {
      //   title: title.trim(),
      //   language: selectedLanguage,
      //   duration,
      //   startTime: startDate,
      //   endTime: endDate,
      //   description,
      //   questionCount,
      //   totalMarks,
      //   generateCertificate,
      //   assignedRegNos: [] // ⚠️ Replace with actual regno list from student selection in future
      // };

      // const res = await axios.post(`${API_BASE}/api/admin/compilerExams/create`, payload , {
      //   withCredentials: true
      // });
      // const { examId } = res.data;

      // toast({ title: "Success", description: "Compiler exam created!" });

      // navigate(`/admin/exam/compiler/question/1`, {
      //   state: {
      //     examData: formData,
      //     totalQuestions: questionCount,
      //     examId
      //   }
      // });
      localStorage.setItem("compilerExamDraft", JSON.stringify(formData));
      navigate("/admin/exam/compiler/question/1", {
        state: { examData: formData, totalQuestions: formData.questionCount, examId: null }
      });

      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create exam",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Create Compiler Exam</h1>
              <p className="text-xs text-muted-foreground">Set up a new coding examination</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Define the exam title, description, and number of questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Exam Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Data Structures Final Exam"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide instructions or context for the exam..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="questionCount">Number of Questions *</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min={1}
                  max={50}
                  value={formData.questionCount}
                  onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks *</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  min={1}
                  max={1000}
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 100 })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Languages Card - Single Select */}
          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-primary" />
                Compiler Language
              </CardTitle>
              <CardDescription>
                Select one programming language for this exam
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {languageConfig.map((lang) => {
                  const isSelected = formData.selectedLanguage === lang.name;
                  return (
                    <button
                      key={lang.name}
                      type="button"
                      onClick={() => selectLanguage(lang.name)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : `${lang.color} border hover:border-primary/50`
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <LanguageIcon language={lang.name} className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">{lang.name}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Card */}
          <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Schedule & Duration
              </CardTitle>
              <CardDescription>
                Set time limits and availability window
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Total Duration (minutes) *
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={480}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options Card */}
          <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Additional Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certificate"
                  checked={formData.generateCertificate}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, generateCertificate: checked as boolean })
                  }
                />
                <Label htmlFor="certificate" className="cursor-pointer">
                  Generate certificate on completion
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit">
              Continue to Questions
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
