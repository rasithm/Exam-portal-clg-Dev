//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\pages\admin\CreateCompilerQuestion.tsx
import { useState , useEffect} from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/uis/button";
import { Input } from "@/components/uis/input";
import { Label } from "@/components/uis/label";
import { Textarea } from "@/components/uis/textarea";
import { Checkbox } from "@/components/uis/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/uis/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/uis/card";
import { Badge } from "@/components/uis/badge";
import { ArrowLeft, Plus, Trash2, FileText, TestTube, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axios from 'axios';
import { baseUrl } from "@/constant/Url";

const API_BASE = baseUrl || "http://localhost:5000";
interface TestCase {
  inputs: string[];
  expectedOutput: string;
  hidden: boolean;
}

export default function CreateCompilerQuestion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  const examData = location.state?.examData;
  const totalQuestions = location.state?.totalQuestions || 1;
  const currentQuestion = parseInt(id || "1");

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    longDescription: "",
    inputFormat: "",
    outputFormat: "",
    sampleInput: "",
    sampleOutput: "",
    attemptLimit: 3,
    evaluationMode: "strict" as "strict" | "non-strict",
    testCases: [{ inputs: [""], expectedOutput: "", hidden: false }] as TestCase[],
  });

  useEffect(() => {
    const storedQuestions = JSON.parse(localStorage.getItem("compilerQuestions") || "[]");
    const saved = storedQuestions[currentQuestion - 1];
    if (saved) {
      setFormData(saved);
    }
  }, [currentQuestion]);

  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { inputs: [""], expectedOutput: "", hidden: false }],
    }));
  };

  const removeTestCase = (index: number) => {
    if (formData.testCases.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      ),
    }));
  };

  const addInput = (testCaseIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) =>
        i === testCaseIndex ? { ...tc, inputs: [...tc.inputs, ""] } : tc
      ),
    }));
  };

  const updateInput = (testCaseIndex: number, inputIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) =>
        i === testCaseIndex
          ? { ...tc, inputs: tc.inputs.map((inp, j) => (j === inputIndex ? value : inp)) }
          : tc
      ),
    }));
  };

  const removeInput = (testCaseIndex: number, inputIndex: number) => {
    const tc = formData.testCases[testCaseIndex];
    if (tc.inputs.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.map((t, i) =>
        i === testCaseIndex
          ? { ...t, inputs: t.inputs.filter((_, j) => j !== inputIndex) }
          : t
      ),
    }));
  };

  const handleSubmit = async (isLast: boolean) => {
    if (!formData.title.trim()) {
      return toast({ title: "Error", description: "Please enter question title", variant: "destructive" });
    }

    for (const [i, tc] of formData.testCases.entries()) {
      const validInputs = tc.inputs.filter(inp => inp.trim() !== "");
      if (validInputs.length === 0 || !tc.expectedOutput.trim()) {
        return toast({
          title: "Error",
          description: `Test case ${i + 1} must have at least one input and expected output`,
          variant: "destructive"
        });
      }
    }

    try {
      let draft = JSON.parse(localStorage.getItem("compilerExamDraft") || "{}");
      let existingQuestions = JSON.parse(localStorage.getItem("compilerQuestions") || "[]");

      // Save current question to temp store
      // const updatedQuestions = [...existingQuestions, {
      //   ...formData,
      //   memoryLimit: 128, // Optional default
      //   marks: draft.totalMarks ? Math.floor(draft.totalMarks / draft.questionCount) : 10
      // }];
      // localStorage.setItem("compilerQuestions", JSON.stringify(updatedQuestions));
      const updatedQuestions = [...existingQuestions];
        updatedQuestions[currentQuestion - 1] = {
          ...formData,
          memoryLimit: 128,
          marks: draft.totalMarks ? Math.floor(draft.totalMarks / draft.questionCount) : 10
        };
        localStorage.setItem("compilerQuestions", JSON.stringify(updatedQuestions));


      if (isLast) {
        const payload = {
          title: draft.title,
          language: draft.selectedLanguage,
          duration: draft.duration,
          startTime: draft.startDate,
          endTime: draft.endDate,
          description: draft.description,
          questionCount: draft.questionCount,
          totalMarks: draft.totalMarks,
          generateCertificate: draft.generateCertificate,
          assignedRegNos: [], // Update if frontend includes student selection
          questions: updatedQuestions
        };

        const res = await axios.post(`${API_BASE}/api/admin/compilerExams/create`, payload, {
          withCredentials: true
        });

        localStorage.removeItem("compilerExamDraft");
        localStorage.removeItem("compilerQuestions");
        toast({ title: "Success", description: "Exam created successfully!" });
        navigate("/admin/exam/create/compiler");
      } else {
        // Navigate to next question
        navigate(`/admin/exam/compiler/question/${currentQuestion + 1}`, {
          state: {
            examData,
            totalQuestions,
            examId: null // Not needed, as everything submits at end
          }
        });
      }

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save exam",
        variant: "destructive"
      });
    }
  };


  // const handleSubmit = async (isLast: boolean) => {
  //   if (!formData.title.trim()) {
  //     toast({ title: "Error", description: "Please enter question title", variant: "destructive" });
  //     return;
  //   }

  //   for (const [i, tc] of formData.testCases.entries()) {
  //     const validInputs = tc.inputs.filter(inp => inp.trim() !== "");
  //     if (validInputs.length === 0 || !tc.expectedOutput.trim()) {
  //       toast({
  //         title: "Error",
  //         description: `Test case ${i + 1} must have at least one input and an expected output`,
  //         variant: "destructive"
  //       });
  //       return;
  //     }
  //   }

  //   try {
  //     let examId = location.state?.examId;

  //     // 🟡 Only create exam if not already created
  //     if (!examId) {
  //       const createPayload = {
  //         ...examData,
  //         language: examData.selectedLanguage,
  //         startTime: examData.startDate,
  //         endTime: examData.endDate,
  //         assignedRegNos: [] // add students if needed
  //       };

  //       const examRes = await axios.post(`${API_BASE}/api/admin/compilerExams/create`, createPayload, {
  //         withCredentials: true
  //       });

  //       examId = examRes.data.examId;
  //     }

  //     // ✅ Now safely create question
  //     await axios.post(`${API_BASE}/api/admin/compilerExams/${examId}/questions`, {
  //       ...formData,
  //       title: formData.title.trim()
  //     }, { withCredentials: true });

  //     if (isLast) {
  //       localStorage.removeItem("compilerExamDraft");
  //       toast({ title: "Success", description: "Exam created successfully!" });
  //       navigate("/admin/exam/create/compiler");
  //     } else {
  //       // ✅ Pass examId forward
  //       navigate(`/admin/exam/compiler/question/${currentQuestion + 1}`, {
  //         state: { examData, totalQuestions, examId }
  //       });
  //     }

  //   } catch (err: any) {
  //     toast({
  //       title: "Error",
  //       description: err.response?.data?.message || "Failed to save question",
  //       variant: "destructive"
  //     });
  //   }
  // };
  const confirmBack = () => {
    const confirmLeave = window.confirm("Going back will reset the current unsaved question. Continue?");
    if (confirmLeave) navigate(-1);
  };




  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={confirmBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">
                Question {currentQuestion} of {totalQuestions}
              </h1>
              <p className="text-xs text-muted-foreground">
                {examData?.title || "Compiler Exam"}
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            {currentQuestion}/{totalQuestions}
          </Badge>
        </div>
      </header>

      <main className="container max-w-4xl py-8 px-4">
        <div className="space-y-6">
          {/* Question Details */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Question Details
              </CardTitle>
              <CardDescription>
                Define the problem statement and formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Question Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Two Sum Problem"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDesc">Short Description</Label>
                <Input
                  id="shortDesc"
                  placeholder="Brief problem statement..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDesc">Full Description (Markdown supported)</Label>
                <Textarea
                  id="longDesc"
                  placeholder="Detailed problem description, constraints, examples..."
                  rows={5}
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inputFormat">Input Format</Label>
                  <Textarea
                    id="inputFormat"
                    placeholder="Describe input format..."
                    rows={3}
                    value={formData.inputFormat}
                    onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outputFormat">Output Format</Label>
                  <Textarea
                    id="outputFormat"
                    placeholder="Describe output format..."
                    rows={3}
                    value={formData.outputFormat}
                    onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sampleInput">Sample Input</Label>
                  <Textarea
                    id="sampleInput"
                    placeholder="5&#10;1 2 3 4 5"
                    rows={3}
                    className="font-mono text-sm"
                    value={formData.sampleInput}
                    onChange={(e) => setFormData({ ...formData, sampleInput: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sampleOutput">Sample Output</Label>
                  <Textarea
                    id="sampleOutput"
                    placeholder="15"
                    rows={3}
                    className="font-mono text-sm"
                    value={formData.sampleOutput}
                    onChange={(e) => setFormData({ ...formData, sampleOutput: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Cases */}
          <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-primary" />
                    Test Cases
                  </CardTitle>
                  <CardDescription>
                    Define test cases for automated evaluation
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Test Case
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.testCases.map((testCase, tcIndex) => (
                <Card key={tcIndex} className="bg-muted/30">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Test Case {tcIndex + 1}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`hidden-${tcIndex}`}
                            checked={testCase.hidden}
                            onCheckedChange={(checked) =>
                              updateTestCase(tcIndex, "hidden", checked)
                            }
                          />
                          <Label htmlFor={`hidden-${tcIndex}`} className="text-xs cursor-pointer">
                            Hidden
                          </Label>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeTestCase(tcIndex)}
                          disabled={formData.testCases.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Inputs</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => addInput(tcIndex)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Input
                        </Button>
                      </div>
                      {testCase.inputs.map((input, inputIndex) => (
                        <div key={inputIndex} className="flex gap-2">
                          <Textarea
                            placeholder={`Input ${inputIndex + 1}`}
                            rows={2}
                            className="font-mono text-xs flex-1"
                            value={input}
                            onChange={(e) => updateInput(tcIndex, inputIndex, e.target.value)}
                          />
                          {testCase.inputs.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => removeInput(tcIndex, inputIndex)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Expected Output</Label>
                      <Textarea
                        placeholder="Expected output..."
                        rows={2}
                        className="font-mono text-xs"
                        value={testCase.expectedOutput}
                        onChange={(e) => updateTestCase(tcIndex, "expectedOutput", e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Question Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="attempts">Attempt Limit (per student)</Label>
                  <Input
                    id="attempts"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.attemptLimit}
                    onChange={(e) =>
                      setFormData({ ...formData, attemptLimit: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evalMode">Evaluation Mode</Label>
                  <Select
                    value={formData.evaluationMode}
                    onValueChange={(value: "strict" | "non-strict") =>
                      setFormData({ ...formData, evaluationMode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict (exact match)</SelectItem>
                      <SelectItem value="non-strict">Non-Strict (ignore whitespace)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <div className="flex gap-3">
              {currentQuestion < totalQuestions ? (
                <Button onClick={() => handleSubmit(false)}>
                  Next Question
                </Button>
              ) : (
                <Button onClick={() => handleSubmit(true)}>
                  Submit Exam
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
