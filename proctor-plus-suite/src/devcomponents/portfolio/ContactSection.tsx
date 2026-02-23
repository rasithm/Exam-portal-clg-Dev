//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devcomponents\portfolio\ContactSection.tsx
import { useState } from "react";
import { motion } from "framer-motion";
// import { getPortfolioData } from "@/hooks/usePortfolioData";
import { Mail, Github, Linkedin, Send, Phone } from "lucide-react";
import { Button } from "@/devcomponents/ui/button";
import { Input } from "@/devcomponents/ui/input";
import { Textarea } from "@/devcomponents/ui/textarea";
import { Label } from "@/devcomponents/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePortfolioData } from "@/hooks/usePortfolioData";

// interface FormState {
//   name: string;
//   email: string;
//   phone: string;
//   subject: string;
//   message: string;
// }
interface FormState {
  name: string;
  email: string;
  pageUrl: string;
  type: string;
  otherType?: string;
  message: string;
  screenshot?: string;
}

const ContactSection = () => {
  const { toast } = useToast();
  // const { personalInfo } = getPortfolioData();
  // const { data } = usePortfolioData();
  // if (!data) return null;
  // const { personalInfo } = data;

  // const [form, setForm] = useState<FormState>({
  //   name: "", email: "", phone: "", subject: "", message: "",
  // });
  
  
  const { data } = usePortfolioData();

  // Declare hooks FIRST
  // const [form, setForm] = useState<FormState>({
  //   name: "",
  //   email: "",
  //   phone: "",
  //   subject: "",
  //   message: "",
  // });
  const lastPages = JSON.parse(localStorage.getItem("lastPages") || "[]");

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    pageUrl: lastPages[0] || window.location.href,
    type: "Bug",
    otherType: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"contact" | "feedback">("contact");

  if (!data) return null;

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((p) => ({ ...p, screenshot: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const personalInfo = data.personalInfo || {};
  // const [errors, setErrors] = useState<Partial<FormState>>({});
  // const [submitting, setSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!emailRegex.test(form.email)) e.email = "Invalid email address";
    // if (form.phone && !phoneRegex.test(form.phone)) e.phone = "Enter a valid phone number";
    // if (!form.subject.trim()) e.subject = "Subject is required";
    if (form.type === "Other" && !form.otherType?.trim()) {
      e.otherType = "Please specify feedback type";
    }
    if (!form.message.trim()) e.message = "Message is required";
    else if (form.message.length < 10) e.message = "Message must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const payload = {
      ...form,
      type: form.type === "Other" ? form.otherType : form.type,
      lastVisitedPages: JSON.parse(localStorage.getItem("lastPages") || "[]"),
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: /Mobi|Android/i.test(navigator.userAgent)
        ? "Mobile"
        : "Desktop",
      os: navigator.platform,
      browser: navigator.userAgent,
      timestamp: new Date(),
    };

    await fetch("http://localhost:5000/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);
    toast({ title: "Feedback Submitted Successfully!" });
  };

  const links = [
    { icon: Mail, label: "Email", value: personalInfo.email, href: `mailto:${personalInfo.email}` },
    { icon: Github, label: "GitHub", value: "github.com/rasithm", href: personalInfo.github },
    { icon: Linkedin, label: "LinkedIn", value: "Mohamed Rasith", href: personalInfo.linkedin },
  ];
  if (!data) {
    return (
      <section className="py-24 px-6 text-center text-muted-foreground">
        Loading contact section...
      </section>
    );
  }
  return (
    <section id="contact" className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          style={{ fontFamily: "Space Grotesk" }}
        >
          Get In <span className="text-gradient">Touch</span>
        </motion.h2>
        <p className="text-center text-muted-foreground mb-12">
          Have a project in mind? Let's build something amazing together.
        </p>

        <div className="grid md:grid-cols-5 gap-10">
          
          {/* Form (wider column) */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-3 space-y-4 bg-card border border-border rounded-2xl p-6"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Name <span className="text-destructive">*</span></Label>
                <Input id="c-name" placeholder="Mohamed Rasith" value={form.name} onChange={set("name")}
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-email">Email <span className="text-destructive">*</span></Label>
                <Input id="c-email" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-subject">Page Name or Url <span className="text-destructive">*</span></Label>
                <Input id="c-subject" placeholder="https://localhost:8080/developer" value={form.pageUrl} onChange={set("pageUrl")}
                  className={errors.pageUrl ? "border-destructive focus-visible:ring-destructive" : ""} />
                {errors.pageUrl && <p className="text-xs text-destructive">{errors.pageUrl}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-phone">ScreenShort <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <div className="relative">
                  {/* <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> */}
                  <input type="file" accept="image/*" onChange={handleScreenshot} />
                </div>
                {errors.screenshot && <p className="text-xs text-destructive">{errors.screenshot}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Feedback Type *</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="Bug">Bug</option>
                  <option value="Feature Suggestion">Feature Suggestion</option>
                  <option value="UI/UX Issue">UI/UX Issue</option>
                  <option value="Performance">Performance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {form.type === "Other" && (
                <div className="space-y-1.5">
                  <Label>Please specify *</Label>
                  <Input
                    value={form.otherType}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, otherType: e.target.value }))
                    }
                    placeholder="Describe feedback type"
                  />
                </div>
              )}
              
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-message">Message <span className="text-destructive">*</span></Label>
              <Textarea
                id="c-message"
                placeholder="Tell me about your feedback, bugs, or Improve Ux..."
                rows={5}
                value={form.message}
                onChange={set("message")}
                className={errors.message ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
            </div>

            <Button type="submit" className="rounded-full w-full" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Send Feedback
                </>
              )}
            </Button>
          </motion.form>

          {/* Links (narrower column) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 flex flex-col justify-center gap-4"
          >
            {links.map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-accent/50 hover:bg-accent/5 transition-all group"
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-accent/10 transition-colors shrink-0">
                  <Icon className="h-5 w-5 text-primary group-hover:text-accent transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-accent transition-colors">{label}</p>
                  <p className="text-xs text-muted-foreground">{value}</p>
                </div>
              </a>
            ))}

            {/* WhatsApp CTA */}
            <a
              href={`https://wa.me/919344533082?text=Hello%20Rasith%2C%20I%20found%20your%20portfolio%20and%20would%20like%20to%20connect!`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-4 rounded-xl border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-all text-green-600 font-medium text-sm"
            >
              <span className="text-xl">💬</span> Contact via WhatsApp
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
