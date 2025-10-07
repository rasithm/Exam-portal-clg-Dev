import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { 
  Plus, 
  Upload, 
  Download, 
  User, 
  Mail, 
  GraduationCap,
  FileSpreadsheet,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { baseUrl } from "../constant/Url";
import { error } from "console";


const CreateStudent = () => {
  const API_BASE = baseUrl || "http://localhost:5000/";

  const [open, setOpen] = useState(false);
  const [studentData, setStudentData] = useState({
    name: "",
    email: "",
    studentId: "",
    department: "",
    year: "",
    password: "", 
    whatsapp_no : "",
    phone_no: ""
  });
  // expose function globally for edit
  // (window as any).openCreateStudentWithData = (student: any) => {
  //   setStudentData({
  //     name: student.name,
  //     email: student.email,
  //     studentId: student.rollNumber,
  //     department: student.department || "",
  //     year: student.year || "",
  //     password: "",
  //     whatsapp_no: student.whatsapp_no || "",
  //     phone_no: student.phone_no || ""
  //   });
  //   setOpen(true);
  //   setActiveTab("single");
  // };

  const [bulkStudents, setBulkStudents] = useState("");
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  // export const openCreateStudentWithData = (student) => {
  //   setStudentData(student);
  //   setOpen(true);
  //   setActiveTab("single");
  // };


  const handleCreateStudent = async() => {
    if (!studentData.name || !studentData.email || !studentData.studentId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Generate random password if not provided
    const password = studentData.password || "ajce@123";
    
    // line ~54 inside handleCreateStudent()
    try {
      const res = await fetch(`${API_BASE}/api/admin/createStudents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...studentData, password }),
      });

      if (!res.ok) throw new Error("Failed to create student");

      const result = await res.json();
      toast({
        title: "Student Created Successfully",
        description: `${result.name} added with ID: ${result.studentId}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create student",
        variant: "destructive",
      });
      return;
    }


    // Reset form
    setStudentData({
      name: "",
      email: "",
      studentId: "",
      department: "",
      year: "",
      password: "",
      whatsapp_no : "",
      phone_no : "" 
    });
    setOpen(false);
  };
  

  const handleBulkCreate = async() => {
    if (!file) {
      toast({
        title: "Error", 
        description: "Please enter student data",
        variant: "destructive",
      });
      return;
    }
    // line ~89 inside handleBulkCreate()
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/admin/students/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to import students");
      const result = await res.json();

      if (result.failedCount > 0) {
        toast({
          title: "Import completed with errors",
          description: `${result.failedCount} failed, ${result.warningsCount || 0} warnings.`,
          variant: "destructive",
        });
      } else if (result.warningsCount > 0) {
        toast({
          title: "Import completed with warnings",
          description: `${result.warningsCount} students skipped (already exist).`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import successful",
          description: `${result.createdCount || 0} students created successfully.`,
        });
      }
      // toast({
      //   title: "Bulk Import Successful",
      //   description: `${result.count} students created`,
      // });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Bulk import failed",
        variant: "destructive",
      });
      return;
    }


    // const lines = bulkStudents.trim().split('\n');
    // toast({
    //   title: "Bulk Import Successful",
    //   description: `${lines.length} students have been created with auto-generated passwords`,
    // });

    setFile(null);
    setBulkStudents("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" className="h-12">
          <Plus className="h-4 w-4 mr-2" />
          Create Student Account
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Student Accounts</DialogTitle>
          <DialogDescription>
            Add individual students or import multiple students at once. Login credentials will be generated automatically.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "single" ? "default" : "outline"}
            onClick={() => setActiveTab("single")}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            Single Student
          </Button>
          <Button
            variant={activeTab === "bulk" ? "default" : "outline"}
            onClick={() => setActiveTab("bulk")}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
        </div>

        {activeTab === "single" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={studentData.name}
                  onChange={(e) => setStudentData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@college.edu"
                  value={studentData.email}
                  onChange={(e) => setStudentData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID *</Label>
                <Input
                  id="studentId"
                  placeholder="CS2024001"
                  value={studentData.studentId}
                  onChange={(e) => setStudentData(prev => ({ ...prev, studentId: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={studentData.department} onValueChange={(value) => setStudentData(prev => ({ ...prev, department: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Information Technology">Information Technology (IT)</SelectItem>
                    <SelectItem value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science (AI & DS)</SelectItem>
                    <SelectItem value="Cybersecurity Engineering">Cybersecurity Engineering</SelectItem>
                    <SelectItem value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning (AI & ML)</SelectItem>
                    <SelectItem value="Computer Science & Engineering">Computer Science & Engineering (CSE)</SelectItem>
                    <SelectItem value="Electronics & Communication Engineering">Electronics & Communication Engineering (ECE)</SelectItem>
                    <SelectItem value="Electrical & Electronics Engineering">Electrical & Electronics Engineering (EEE)</SelectItem>
                    <SelectItem value="Civil Engineering">Civil Engineering (CE)</SelectItem>
                    <SelectItem value="Mechanical Engineering">Mechanical Engineering (ME)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year *</Label>
                <Select value={studentData.year} onValueChange={(value) => setStudentData(prev => ({ ...prev, year: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Auto-generated if empty"
                  value={studentData.password}
                  onChange={(e) => setStudentData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp_no">Whatsapp no *</Label>
                <Input
                  id="whatsapp_no"
                  placeholder="enter your whatsapp_no"
                  value={studentData.whatsapp_no}
                  onChange={(e) => setStudentData(prev => ({ ...prev, whatsapp_no: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone_no">Phone no</Label>
                <Input
                  id="phone_no"
                  placeholder="Enter your phone_no"
                  value={studentData.phone_no}
                  onChange={(e) => setStudentData(prev => ({ ...prev, phone_no: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> If no password is provided, a secure password will be automatically generated. 
                The student will receive their login credentials via email.
              </p>
            </div>

            <Button onClick={handleCreateStudent} variant="hero" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Student Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Bulk Import Format</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Enter one student per line in the following format:
              </p>
              <code className="text-xs bg-background p-2 rounded block">
                s_no, name, regno, password, department, emailID, whatsapp_no, Academic Year, phone_no
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Example: 01 , Rasith, 311823205030, password, Information Technology, 311823205030@msajce-edu.in , whatsapp_no, 3nd year, phone_no
              </p>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="bulk-data">Student Data</Label>
              <Textarea
                id="bulk-data"
                placeholder="John Smith, john@college.edu, CS2024001, Computer Science, 2&#10;Jane Doe, jane@college.edu, CS2024002, Mathematics, 1"
                value={bulkStudents}
                onChange={(e) => setBulkStudents(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div> */}
            <input
                  type="file"
                  id="fileInput"
                  accept=".csv,.xlsx"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      setFile(selectedFile);
                      toast({
                        title: "File selected",
                        description: `${selectedFile.name} ready for upload.`,
                      });
                    }
                  }}
                />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => document.getElementById("fileInput")?.click()}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import from Excel
              </Button>
              <Button variant="outline" className="flex-1" onClick={async () => {
                    const res = await fetch(`${API_BASE}/api/admin/students/template`, {
                      credentials: "include",
                    });
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "student_template.csv";
                    a.click();
                  }}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <Button onClick={handleBulkCreate} variant="hero" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Create All Students
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateStudent;