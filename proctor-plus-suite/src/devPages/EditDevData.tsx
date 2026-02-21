//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devPages\DeveloperDashboard.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolioData, PortfolioProject, PortfolioExperience, PortfolioAchievement } from "@/hooks/usePortfolioData";
import { Button } from "@/devcomponents/ui/button";
import { Input } from "@/devcomponents/ui/input";
import { Textarea } from "@/devcomponents/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/devcomponents/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Save, Plus, Trash2, X, Upload, RotateCcw, User
} from "lucide-react";
import logo from "@/assets/logo.png";

const GRADIENT_OPTIONS = [
  "from-blue-500 to-cyan-400",
  "from-green-500 to-emerald-400",
  "from-purple-500 to-pink-400",
  "from-orange-500 to-yellow-400",
  "from-red-500 to-rose-400",
  "from-indigo-500 to-violet-400",
];

const EditDevData = () => {
  const navigate = useNavigate();
  // const { isAuthenticated } = useAuth();
  const { data, update, reset } = usePortfolioData();
  const { toast } = useToast();
  const photoRef = useRef<HTMLInputElement>(null);

  // ── Local editable state ──────────────────────────────
  const [info, setInfo] = useState({ ...data.personalInfo });
  const [skills, setSkills] = useState<Record<string, string[]>>(
    JSON.parse(JSON.stringify(data.skills))
  );
  const [projects, setProjects] = useState<PortfolioProject[]>(
    JSON.parse(JSON.stringify(data.projects))
  );
  const [experience, setExperience] = useState<PortfolioExperience[]>(
    JSON.parse(JSON.stringify(data.experience))
  );
  const [achievements, setAchievements] = useState<PortfolioAchievement[]>(
    JSON.parse(JSON.stringify(data.achievements))
  );

  // new-skill input per category
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});
  // new category name
  const [newCategoryName, setNewCategoryName] = useState("");

  // if (!isAuthenticated) {
  //   navigate("/developer/login");
  //   return null;
  // }

  // ── Photo upload ──────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setInfo((p) => ({ ...p, photo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // ── Save all ──────────────────────────────────────────
  const handleSave = () => {
    update({ personalInfo: info, skills, projects, experience, achievements });
    toast({ title: "✅ Portfolio Updated!", description: "Changes are live on your public page." });
  };

  const handleReset = () => {
    if (!confirm("Reset all data to defaults? This cannot be undone.")) return;
    reset();
    toast({ title: "Data reset to defaults." });
    navigate("/developer/dashboard");
  };

  // ── Skills helpers ────────────────────────────────────
  const addSkill = (cat: string) => {
    const val = (newSkillInputs[cat] || "").trim();
    if (!val) return;
    setSkills((p) => ({ ...p, [cat]: [...(p[cat] || []), val] }));
    setNewSkillInputs((p) => ({ ...p, [cat]: "" }));
  };

  const removeSkill = (cat: string, skill: string) => {
    setSkills((p) => ({ ...p, [cat]: p[cat].filter((s) => s !== skill) }));
  };

  const addCategory = () => {
    const name = newCategoryName.trim();
    if (!name || skills[name]) return;
    setSkills((p) => ({ ...p, [name]: [] }));
    setNewCategoryName("");
  };

  const removeCategory = (cat: string) => {
    setSkills((p) => {
      const next = { ...p };
      delete next[cat];
      return next;
    });
  };

  // ── Projects helpers ──────────────────────────────────
  const addProject = () => {
    setProjects((p) => [
      ...p,
      {
        title: "New Project",
        subtitle: "Category",
        description: "Description here...",
        tech: [],
        github: "https://github.com/rasithm",
        color: "from-blue-500 to-cyan-400",
      },
    ]);
  };

  const updateProject = (i: number, patch: Partial<PortfolioProject>) => {
    setProjects((p) => p.map((pr, idx) => (idx === i ? { ...pr, ...patch } : pr)));
  };

  const updateProjectTech = (i: number, val: string) => {
    updateProject(i, { tech: val.split(",").map((t) => t.trim()).filter(Boolean) });
  };

  const removeProject = (i: number) => {
    setProjects((p) => p.filter((_, idx) => idx !== i));
  };

  // ── Experience helpers ────────────────────────────────
  const addExperience = () => {
    setExperience((p) => [
      ...p,
      { role: "Role", company: "Company", period: "2024 – Present", details: ["Detail..."] },
    ]);
  };

  const updateExp = (i: number, patch: Partial<PortfolioExperience>) => {
    setExperience((p) => p.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  };

  const updateExpDetails = (i: number, val: string) => {
    updateExp(i, { details: val.split("\n").filter(Boolean) });
  };

  const removeExp = (i: number) => {
    setExperience((p) => p.filter((_, idx) => idx !== i));
  };

  // ── Achievements helpers ──────────────────────────────
  const addAchievement = () => {
    setAchievements((p) => [...p, { icon: "🏆", title: "Achievement", description: "Description" }]);
  };

  const updateAch = (i: number, patch: Partial<PortfolioAchievement>) => {
    setAchievements((p) => p.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  const removeAch = (i: number) => {
    setAchievements((p) => p.filter((_, idx) => idx !== i));
  };

  // ── UI ────────────────────────────────────────────────
  return (
    <div className="developer-theme min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-8 w-8 rounded-lg" />
            <div>
              <h1 className="font-bold text-base" style={{ fontFamily: "Space Grotesk" }}>
                Edit Portfolio Data
              </h1>
              <p className="text-xs text-muted-foreground">Changes save to your browser & reflect live</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/developer/dashboard")}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset} className="text-destructive border-destructive/30 hover:bg-destructive/10">
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
            </Button>
            <Button size="sm" onClick={handleSave} className="rounded-full">
              <Save className="mr-1.5 h-4 w-4" /> Save All
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            {["personal", "skills", "projects", "experience", "achievements"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize rounded-lg text-sm">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── PERSONAL INFO ── */}
          <TabsContent value="personal">
            <Section title="Personal Info" subtitle="Update your public profile details (name is static)">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Photo */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div
                    onClick={() => photoRef.current?.click()}
                    className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-border hover:border-accent/60 cursor-pointer overflow-hidden group transition-colors"
                  >
                    {info.photo ? (
                      <img src={info.photo} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <User className="h-8 w-8" />
                        <span className="text-[10px]">Upload Photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  {info.photo && (
                    <button onClick={() => setInfo((p) => ({ ...p, photo: undefined }))} className="text-[11px] text-destructive hover:underline">
                      Remove photo
                    </button>
                  )}
                  <p className="text-[11px] text-muted-foreground text-center">Shown in dashboard<br/>& portfolio</p>
                </div>

                {/* Fields */}
                <div className="flex-1 grid sm:grid-cols-2 gap-4">
                  <Field label="Name (static — cannot change)">
                    <Input value={info.name} disabled className="opacity-60 cursor-not-allowed" />
                  </Field>
                  <Field label="Title / Headline">
                    <Input value={info.title} onChange={(e) => setInfo((p) => ({ ...p, title: e.target.value }))} />
                  </Field>
                  <Field label="Tagline">
                    <Input value={info.tagline} onChange={(e) => setInfo((p) => ({ ...p, tagline: e.target.value }))} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={info.email} onChange={(e) => setInfo((p) => ({ ...p, email: e.target.value }))} />
                  </Field>
                  <Field label="GitHub URL">
                    <Input value={info.github} onChange={(e) => setInfo((p) => ({ ...p, github: e.target.value }))} />
                  </Field>
                  <Field label="LinkedIn URL">
                    <Input value={info.linkedin} onChange={(e) => setInfo((p) => ({ ...p, linkedin: e.target.value }))} />
                  </Field>
                  <Field label="Degree">
                    <Input value={info.education.degree} onChange={(e) => setInfo((p) => ({ ...p, education: { ...p.education, degree: e.target.value } }))} />
                  </Field>
                  <Field label="Institution">
                    <Input value={info.education.institution} onChange={(e) => setInfo((p) => ({ ...p, education: { ...p.education, institution: e.target.value } }))} />
                  </Field>
                  <Field label="Expected Graduation">
                    <Input value={info.education.expected} onChange={(e) => setInfo((p) => ({ ...p, education: { ...p.education, expected: e.target.value } }))} />
                  </Field>
                  <Field label="Certification Title">
                    <Input value={info.certification.title} onChange={(e) => setInfo((p) => ({ ...p, certification: { ...p.certification, title: e.target.value } }))} />
                  </Field>
                  <Field label="Certification Org">
                    <Input value={info.certification.org} onChange={(e) => setInfo((p) => ({ ...p, certification: { ...p.certification, org: e.target.value } }))} />
                  </Field>
                  <Field label="Certification Duration">
                    <Input value={info.certification.duration} onChange={(e) => setInfo((p) => ({ ...p, certification: { ...p.certification, duration: e.target.value } }))} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Professional Objective">
                      <Textarea
                        rows={4}
                        value={info.objective}
                        onChange={(e) => setInfo((p) => ({ ...p, objective: e.target.value }))}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </Section>
          </TabsContent>

          {/* ── SKILLS ── */}
          <TabsContent value="skills">
            <Section title="Skills" subtitle="Add or remove skills per category, or create new categories">
              <div className="space-y-5">
                {Object.entries(skills).map(([cat, items]) => (
                  <div key={cat} className="p-5 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-sm">{cat}</h4>
                      <button onClick={() => removeCategory(cat)} className="text-destructive hover:text-destructive/70 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {items.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {skill}
                          <button onClick={() => removeSkill(cat, skill)} className="ml-1 hover:text-destructive transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add skill..."
                        className="h-8 text-sm"
                        value={newSkillInputs[cat] || ""}
                        onChange={(e) => setNewSkillInputs((p) => ({ ...p, [cat]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addSkill(cat)}
                      />
                      <Button size="sm" variant="outline" onClick={() => addSkill(cat)} className="h-8 shrink-0">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {/* Add category */}
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name (e.g. DevOps)..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={addCategory}>
                    <Plus className="h-4 w-4 mr-1" /> Add Category
                  </Button>
                </div>
              </div>
            </Section>
          </TabsContent>

          {/* ── PROJECTS ── */}
          <TabsContent value="projects">
            <Section title="Projects" subtitle="Edit project details. Tech stack: comma-separated.">
              <div className="space-y-5">
                {projects.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${p.color}`} />
                      <button onClick={() => removeProject(i)} className="text-destructive hover:text-destructive/70 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Title">
                        <Input value={p.title} onChange={(e) => updateProject(i, { title: e.target.value })} />
                      </Field>
                      <Field label="Subtitle / Category">
                        <Input value={p.subtitle} onChange={(e) => updateProject(i, { subtitle: e.target.value })} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Description">
                          <Textarea rows={3} value={p.description} onChange={(e) => updateProject(i, { description: e.target.value })} />
                        </Field>
                      </div>
                      <Field label="Tech Stack (comma separated)">
                        <Input value={p.tech.join(", ")} onChange={(e) => updateProjectTech(i, e.target.value)} />
                      </Field>
                      <Field label="GitHub URL">
                        <Input value={p.github} onChange={(e) => updateProject(i, { github: e.target.value })} />
                      </Field>
                      <Field label="Live Demo URL (optional)">
                        <Input value={p.live || ""} onChange={(e) => updateProject(i, { live: e.target.value })} />
                      </Field>
                      <Field label="Impact (optional)">
                        <Input value={p.impact || ""} onChange={(e) => updateProject(i, { impact: e.target.value })} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Card Color">
                          <div className="flex gap-2 flex-wrap">
                            {GRADIENT_OPTIONS.map((g) => (
                              <button
                                key={g}
                                onClick={() => updateProject(i, { color: g })}
                                className={`h-7 w-16 rounded-md bg-gradient-to-r ${g} border-2 transition-all ${p.color === g ? "border-foreground scale-110" : "border-transparent"}`}
                              />
                            ))}
                          </div>
                        </Field>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <Button variant="outline" className="w-full rounded-xl border-dashed" onClick={addProject}>
                  <Plus className="h-4 w-4 mr-2" /> Add Project
                </Button>
              </div>
            </Section>
          </TabsContent>

          {/* ── EXPERIENCE ── */}
          <TabsContent value="experience">
            <Section title="Experience" subtitle="Each detail on a new line.">
              <div className="space-y-5">
                {experience.map((exp, i) => (
                  <div key={i} className="p-5 rounded-xl border border-border bg-card">
                    <div className="flex justify-end mb-2">
                      <button onClick={() => removeExp(i)} className="text-destructive hover:text-destructive/70 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Role">
                        <Input value={exp.role} onChange={(e) => updateExp(i, { role: e.target.value })} />
                      </Field>
                      <Field label="Company">
                        <Input value={exp.company} onChange={(e) => updateExp(i, { company: e.target.value })} />
                      </Field>
                      <Field label="Period">
                        <Input value={exp.period} onChange={(e) => updateExp(i, { period: e.target.value })} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Details (one per line)">
                          <Textarea
                            rows={4}
                            value={exp.details.join("\n")}
                            onChange={(e) => updateExpDetails(i, e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full rounded-xl border-dashed" onClick={addExperience}>
                  <Plus className="h-4 w-4 mr-2" /> Add Experience
                </Button>
              </div>
            </Section>
          </TabsContent>

          {/* ── ACHIEVEMENTS ── */}
          <TabsContent value="achievements">
            <Section title="Achievements" subtitle="Edit your awards and milestones.">
              <div className="grid sm:grid-cols-2 gap-4">
                {achievements.map((a, i) => (
                  <div key={i} className="p-5 rounded-xl border border-border bg-card">
                    <div className="flex justify-between mb-3">
                      <span className="text-2xl">{a.icon}</span>
                      <button onClick={() => removeAch(i)} className="text-destructive hover:text-destructive/70 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Field label="Icon (emoji)">
                        <Input value={a.icon} onChange={(e) => updateAch(i, { icon: e.target.value })} className="text-lg" />
                      </Field>
                      <Field label="Title">
                        <Input value={a.title} onChange={(e) => updateAch(i, { title: e.target.value })} />
                      </Field>
                      <Field label="Description">
                        <Input value={a.description} onChange={(e) => updateAch(i, { description: e.target.value })} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full rounded-xl border-dashed mt-4" onClick={addAchievement}>
                <Plus className="h-4 w-4 mr-2" /> Add Achievement
              </Button>
            </Section>
          </TabsContent>
        </Tabs>

        {/* Sticky save footer */}
        <div className="mt-8 flex justify-end gap-3 pb-8">
          <Button variant="ghost" onClick={() => navigate("/developer/dashboard")}>Cancel</Button>
          <Button onClick={handleSave} size="lg" className="rounded-full px-8">
            <Save className="mr-2 h-4 w-4" /> Save All Changes
          </Button>
        </div>
      </main>
    </div>
  );
};

// ─── Helper components ──────────────────────────────────
const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-6"
  >
    <div>
      <h2 className="text-xl font-bold" style={{ fontFamily: "Space Grotesk" }}>{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </motion.div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

export default EditDevData;
