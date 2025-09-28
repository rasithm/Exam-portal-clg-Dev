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

const CreateStudent = () => {
  const [open, setOpen] = useState(false);
  const [studentData, setStudentData] = useState({
    name: "",
    email: "",
    studentId: "",
    department: "",
    year: "",
    password: ""
  });
  const [bulkStudents, setBulkStudents] = useState("");
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const { toast } = useToast();

  const handleCreateStudent = () => {
    if (!studentData.name || !studentData.email || !studentData.studentId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Generate random password if not provided
    const password = studentData.password || `pass${Math.random().toString(36).slice(2, 8)}`;
    
    toast({
      title: "Student Created Successfully",
      description: `${studentData.name} has been added with login credentials`,
    });

    // Reset form
    setStudentData({
      name: "",
      email: "",
      studentId: "",
      department: "",
      year: "",
      password: ""
    });
    setOpen(false);
  };

  const handleBulkCreate = () => {
    if (!bulkStudents.trim()) {
      toast({
        title: "Error", 
        description: "Please enter student data",
        variant: "destructive",
      });
      return;
    }

    const lines = bulkStudents.trim().split('\n');
    toast({
      title: "Bulk Import Successful",
      description: `${lines.length} students have been created with auto-generated passwords`,
    });

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
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="computer-science">Computer Science</SelectItem>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year</Label>
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
                Name, Email, Student ID, Department, Year
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Example: John Smith, john@college.edu, CS2024001, Computer Science, 2
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-data">Student Data</Label>
              <Textarea
                id="bulk-data"
                placeholder="John Smith, john@college.edu, CS2024001, Computer Science, 2&#10;Jane Doe, jane@college.edu, CS2024002, Mathematics, 1"
                value={bulkStudents}
                onChange={(e) => setBulkStudents(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import from Excel
              </Button>
              <Button variant="outline" className="flex-1">
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