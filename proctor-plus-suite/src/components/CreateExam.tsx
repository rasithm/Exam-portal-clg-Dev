//C:\Users\nazeer\Downloads\Exam-portal\Exam-portal\proctor-plus-suite\src\components\CreateExam.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { Upload, FileSpreadsheet, Plus, Users, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { baseUrl } from "../constant/Url";

const CreateExam = () => {
  const API_BASE = baseUrl || "http://localhost:5000";
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"import" | "create">("import");
  const [qsMode, setQsMode] = useState("single"); // "single" or "multiple"


  // Import questions
  const [importData, setImportData] = useState({
    fileName: "",
    category: "",
    subcategory: "",
    sharedAdmins: "",
    notes: "",
  });
  const [file, setFile] = useState<File | null>(null);

  // Create exam
  const [examData, setExamData] = useState({
    examName: "",
    fileName: "",
    category: "",
    subcategory: "",
    questionSets: "",
    startDateTime: "",
    endDateTime: "",
    duration: "",
    assignStudents: "",
    reassignAllowed: false,
    instructions: "",
  });
  const [questionSets, setQuestionSets] = useState<any[]>([]);

  const categories = {
    "Tech": ["Java", "Python", "React", "Node.js", "C++"],
    "Non-Tech": ["Aptitude", "Reasoning", "Verbal", "GK"],
    "re-Assign-Exam" : ["particular Student" , "All"]
  };

  useEffect(() => {
    // load question sets for dropdown
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/questions/list`, { credentials: "include" });
        if (res.ok) setQuestionSets(await res.json());
      } catch (e) { console.error("Failed to load question sets"); }
    })();
  }, []);

  // --- Import Questions ---
  const handleImportQuestions = async () => {
    if (!importData.fileName || !importData.category || !importData.subcategory || !file) {
      toast({ title: "Error", description: "All fields & file required", variant: "destructive" });
      return;
    }
    const formData = new FormData();
    formData.append("fileName", importData.fileName);
    formData.append("category", importData.category);
    formData.append("subcategory", importData.subcategory);
    formData.append("sharedAdmins", importData.sharedAdmins);
    formData.append("notes", importData.notes);
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/admin/questions/import`, {
        method: "POST", credentials: "include", body: formData
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Import failed");

      if (result.failedCount > 0) {
        toast({
          title: "Import completed with errors",
          description: `${result.failedCount} failed, ${result.warningsCount || 0} warnings.`,
          variant: "destructive",
        });
      } else if (result.warningsCount > 0) {
        toast({
          title: "Import completed with warnings",
          description: `${result.warningsCount} duplicates skipped.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import successful",
          description: `${result.createdCount || 0} questions imported.`,
        });
      }
      setImportData({ fileName: "", category: "", subcategory: "", sharedAdmins: "", notes: "" });
      setFile(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // --- Create Exam ---
  const handleCreateExam = async () => {
    // Trim and normalize all string fields
    const cleanedExamData = {
      ...examData,
      examName: examData.examName.trim(),
      fileName: examData.fileName.trim(),
      category: examData.category.trim(),
      subcategory: examData.subcategory.trim(),
      questionSets: examData.questionSets.trim(),
      startDateTime: examData.startDateTime.trim(),
      endDateTime: examData.endDateTime.trim(),
      duration: examData.duration.toString().trim(),
      assignStudents: examData.assignStudents.trim(),
      instructions: examData.instructions.trim(),
    };

    // --- Validation ---
    const requiredFields = [
      "examName",
      "category",
      "subcategory",
      "startDateTime",
      "endDateTime",
      "duration",
      "questionSets"
    ];

    for (const field of requiredFields) {
      if (!cleanedExamData[field]) {
        toast({
          title: "Missing Field",
          description: `Please fill the ${field} field before continuing.`,
          variant: "destructive",
        });
        return;
      }
    }

    // For fileName only required if questionSets == "single-subCategory"
    if (
      cleanedExamData.questionSets === "single-subCategory" &&
      !cleanedExamData.fileName
    ) {
      toast({
        title: "Missing File Name",
        description: "File Name is required when using a single subcategory set.",
        variant: "destructive",
      });
      return;
    }

    // Validate time order
    const start = new Date(cleanedExamData.startDateTime);
    const end = new Date(cleanedExamData.endDateTime);
    if (end <= start) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    // Duration check
    const durationMinutes = parseInt(cleanedExamData.duration, 10);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      toast({
        title: "Invalid Duration",
        description: "Duration must be a positive number in minutes.",
        variant: "destructive",
      });
      return;
    }

    // Prepare final payload
    // const payload = {
    //   ...cleanedExamData,
    //   duration: durationMinutes,
    //   reassignAllowed: !!cleanedExamData.reassignAllowed,
    //   assignStudents: cleanedExamData.assignStudents
    //     ? cleanedExamData.assignStudents
    //         .split(",")
    //         .map((s) => s.trim())
    //         .filter(Boolean)
    //     : [],
    // };
    // 🟢 Updated payload: automatically enable reassignAllowed for re-Assign-Exam category
    const payload = {
      ...cleanedExamData,
      duration: durationMinutes,
      reassignAllowed:
        cleanedExamData.category === "re-Assign-Exam" ? true : !!cleanedExamData.reassignAllowed,
      assignStudents: cleanedExamData.assignStudents
        ? cleanedExamData.assignStudents
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };



    try {
      console.log("[CreateExam] payload =>", payload);
      const res = await fetch(`${API_BASE}/api/admin/exams/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // withCredentials: true,
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Exam creation failed");

      toast({
        title: "Exam Created ✅",
        description: `${result.examName || "Exam"} created successfully.`,
      });

      // Reset form after success
      setExamData({
        examName: "",
        fileName: "",
        category: "",
        subcategory: "",
        questionSets: "",
        startDateTime: "",
        endDateTime: "",
        duration: "",
        assignStudents: "",
        reassignAllowed: false,
        instructions: "",
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong while creating exam.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="h-12">
          <Plus className="h-4 w-4 mr-2" /> Create Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>Import question files or configure a new exam.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-6">
          <Button variant={activeTab === "import" ? "default" : "outline"}
                  onClick={() => setActiveTab("import")} className="flex-1">Import Questions</Button>
          <Button variant={activeTab === "create" ? "default" : "outline"}
                  onClick={() => setActiveTab("create")} className="flex-1">Create Exam</Button>
        </div>

        {activeTab === "import" ? (
          <div className="space-y-4">
            <Label>File Name *</Label>
            <Input value={importData.fileName}
                   onChange={(e) => setImportData(p => ({ ...p, fileName: e.target.value }))} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={importData.category}
                        onValueChange={(val) => setImportData(p => ({ ...p, category: val, subcategory: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tech">Tech</SelectItem>
                    <SelectItem value="Non-Tech">Non-Tech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subcategory *</Label>
                <Select value={importData.subcategory}
                        onValueChange={(val) => setImportData(p => ({ ...p, subcategory: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select Subcategory" /></SelectTrigger>
                  <SelectContent>
                    {(categories[importData.category] || []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Shared Admins (comma-separated emails)</Label>
              <Input placeholder="admin1@gmail.com, admin2@gmail.com"
                     value={importData.sharedAdmins}
                     onChange={(e) => setImportData(p => ({ ...p, sharedAdmins: e.target.value }))}/>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Describe this question set (optional)"
                        value={importData.notes}
                        onChange={(e) => setImportData(p => ({ ...p, notes: e.target.value }))}/>
            </div>

            <input type="file" id="importFileInput" accept=".csv,.xlsx" style={{ display: "none" }}
                   onChange={(e) => {
                     const f = e.target.files?.[0];
                     if (f) {
                       setFile(f);
                       toast({ title: "File selected", description: `${f.name} ready for upload.` });
                     }
                   }} />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => document.getElementById("importFileInput")?.click()}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Choose File
              </Button>
              <Button variant="hero" onClick={handleImportQuestions}>
                <Upload className="h-4 w-4 mr-2" /> Upload & Import
              </Button>
              <Button variant="outline" onClick={async () => {
                const res = await fetch(`${API_BASE}/api/admin/questions/template`, { credentials: "include" });
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "questions_template.xlsx";
                a.click();
              }}>
                <Download className="h-4 w-4 mr-2" /> Download Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Label>Exam Name *</Label>
            <Input value={examData.examName}
                   onChange={(e) => setExamData(p => ({ ...p, examName: e.target.value }))} />

            <Label>File Name *</Label>
            <Input value={examData.fileName}
                   onChange={(e) => setExamData(p => ({ ...p, fileName: e.target.value }))} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={examData.category}
                        onValueChange={(val) => setExamData(p => ({ ...p, category: val, subcategory: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tech">Tech</SelectItem>
                    <SelectItem value="Non-Tech">Non-Tech</SelectItem>
                    <SelectItem value="re-Assign-Exam">re-Assign Exam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subcategory *</Label>
                <Select value={examData.subcategory}
                        onValueChange={(val) => setExamData(p => ({ ...p, subcategory: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select Subcategory" /></SelectTrigger>
                  <SelectContent>
                    {(categories[examData.category] || []).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
                <Label>question set *</Label>
                <Select value={examData.questionSets}
                        onValueChange={(val) => setExamData(p => ({ ...p, questionSets: val,}))}>
                  <SelectTrigger><SelectValue placeholder="Select file-cateory" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-subCategory">single-subCategory</SelectItem>
                    <SelectItem value="Multiple-subCategory">Multiple-subCategory</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            


            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date & Time *</Label>
                <Input type="datetime-local"
                       value={examData.startDateTime}
                       onChange={(e) => setExamData(p => ({ ...p, startDateTime: e.target.value }))}/></div>
              <div><Label>End Date & Time *</Label>
                <Input type="datetime-local"
                       value={examData.endDateTime}
                       onChange={(e) => setExamData(p => ({ ...p, endDateTime: e.target.value }))}/></div>
            </div>

            <Label>Duration (minutes) *</Label>
            <Input type="number" min="1" value={examData.duration}
                   onChange={(e) => setExamData(p => ({ ...p, duration: e.target.value }))}/>

            <Label>Assign Students (RegNos, optional)</Label>
            <Input placeholder="311823205030, 311823205031"
                   value={examData.assignStudents}
                   onChange={(e) => setExamData(p => ({ ...p, assignStudents: e.target.value }))}/>

            <Label>Instructions</Label>
            <Textarea placeholder="Write exam rules or guidelines..."
                      value={examData.instructions}
                      onChange={(e) => setExamData(p => ({ ...p, instructions: e.target.value }))}/>

            <Button onClick={handleCreateExam} variant="hero" className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Create Exam
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateExam;
