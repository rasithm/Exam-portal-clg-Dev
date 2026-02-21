//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devPages\DeveloperDashboard.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { mockStudents } from "@/data/portfolio-data";
import { Button } from "@/devcomponents/ui/button";
import { Input } from "@/devcomponents/ui/input";
import { Badge } from "@/devcomponents/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/devcomponents/ui/table";
import { Search, LogOut, Users, ArrowLeft, Edit3, User } from "lucide-react";
import logo from "@/assets/logo.png";

const DeveloperDashboard = () => {
  const navigate = useNavigate();
  // const { isAuthenticated, logout } = useAuth();
  const { data } = usePortfolioData();
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");

  // if (!isAuthenticated) {
  //   navigate("/developer/login");
  //   return null;
  // }

  const { personalInfo } = data;
  const courses = [...new Set(mockStudents.map((s) => s.course))];

  const filtered = mockStudents.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchCourse = !filterCourse || s.course === filterCourse;
    return matchSearch && matchCourse;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "Active": return "default";
      case "Completed": return "secondary";
      case "Pending": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="developer-theme min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-9 w-9 rounded-lg" />
            <div>
              <h1 className="font-bold text-lg" style={{ fontFamily: "Space Grotesk" }}>
                AasaanTech Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">Course Registrants</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Portfolio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {navigate("/developer/login"); }}
            >
              <LogOut className="mr-1.5 h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Developer Profile Card ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-6"
        >
          {/* Decorative gradient strip */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-accent/30 shadow-lg">
                {personalInfo.photo ? (
                  <img src={personalInfo.photo} alt={personalInfo.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="h-8 w-8 text-primary-foreground" />
                  </div>
                )}
              </div>
              {/* Online dot */}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-card" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold" style={{ fontFamily: "Space Grotesk" }}>
                  {personalInfo.name}
                </h2>
                <Badge variant="secondary" className="text-xs">Developer</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {personalInfo.title}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>📧 {personalInfo.email}</span>
                <span>🎓 {personalInfo.education.institution}</span>
              </div>
            </div>

            {/* Edit button */}
            <Button
              onClick={() => navigate("/developer/edit")}
              className="rounded-full shrink-0"
              size="sm"
            >
              <Edit3 className="mr-1.5 h-4 w-4" />
              Edit Portfolio Data
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Students", value: mockStudents.length },
            { label: "Active", value: mockStudents.filter((s) => s.status === "Active").length },
            { label: "Completed", value: mockStudents.filter((s) => s.status === "Completed").length },
            { label: "Courses", value: courses.length },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl border border-border bg-card"
            >
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.email}</TableCell>
                  <TableCell>{s.course}</TableCell>
                  <TableCell className="text-muted-foreground">{s.registeredAt}</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(s.status) as any}>{s.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No students found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>
      </main>
    </div>
  );
};

export default DeveloperDashboard;
