//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devcomponents\portfolio\HeroSection.tsx
import { motion } from "framer-motion";
import { ArrowDown, Github, Mail, MapPin, Sparkles } from "lucide-react";
// import { getPortfolioData } from "@/hooks/usePortfolioData";
import { Button } from "@/devcomponents/ui/button";
import { usePortfolioData } from "@/hooks/usePortfolioData";

const HeroSection = () => {
  // const { personalInfo } = getPortfolioData();
  
  const { data } = usePortfolioData();
  if (!data) return null;
  const { personalInfo } = data;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "30px 30px",
      }} />

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-12 w-full">
        <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">

          {/* ── Left: Text Content ── */}
          <motion.div
            className="flex-1 text-center md:text-left"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-border bg-muted/50 text-sm text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Available for Freelance & Collaboration
            </motion.div>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 leading-tight"
              style={{ fontFamily: "Space Grotesk" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Hi, I'm{" "}
              <span className="text-gradient block sm:inline">
                {personalInfo.name}
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-3 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
            >
              {personalInfo.title}
            </motion.p>

            <motion.p
              className="text-sm text-muted-foreground/70 max-w-lg mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              {personalInfo.tagline}
            </motion.p>

            <motion.div
              className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mb-8 justify-center md:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
            >
              <MapPin className="h-3 w-3" />
              Chennai, India
            </motion.div>

            <motion.div
              className="flex flex-wrap justify-center md:justify-start gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Button asChild size="lg" className="rounded-full">
                <a href="#projects">View Projects</a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <a href="#contact">
                  <Mail className="mr-2 h-4 w-4" /> Contact Me
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <a href={personalInfo.github} target="_blank" rel="noreferrer">
                  <Github className="mr-2 h-4 w-4" /> GitHub
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* ── Right: Developer Photo Card ── */}
          <motion.div
            className="relative flex-shrink-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 80 }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))",
                padding: "3px",
                borderRadius: "9999px",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Card container */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full">
              {/* Spinning gradient border */}
              <motion.div
                className="absolute -inset-1 rounded-full z-0"
                style={{
                  background: "conic-gradient(from 0deg, hsl(var(--primary) / 0.8), hsl(var(--accent) / 0.8), hsl(127 66% 65% / 0.4), hsl(var(--primary) / 0.8))",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />

              {/* Glow pulse behind photo */}
              <motion.div
                className="absolute inset-4 rounded-full blur-2xl z-0"
                style={{ background: "hsl(var(--accent) / 0.3)" }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Photo or Initials */}
              <div className="absolute inset-1 rounded-full overflow-hidden border-4 border-background z-10 bg-card flex items-center justify-center">
                {personalInfo.photo ? (
                  <img
                    src={personalInfo.photo}
                    alt={personalInfo.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-2 relative"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                  >
                    {/* Initials */}
                    <span className="text-5xl md:text-6xl font-black text-white/90 tracking-widest select-none" style={{ fontFamily: "Space Grotesk" }}>
                      {personalInfo.name.split(" ").map(n => n[0]).join("") || "Mohamed Rasith"}
                    </span>
                    <span className="text-xs text-white/60 font-medium tracking-widest uppercase">Developer</span>
                  </div>
                )}
              </div>

              {/* Floating badges */}
              <motion.div
                className="absolute -top-2 -right-2 z-20 px-3 py-1.5 rounded-full border border-border bg-card/90 backdrop-blur-sm shadow-lg text-xs font-semibold flex items-center gap-1.5"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-accent">⚡</span> Full Stack
              </motion.div>

              <motion.div
                className="absolute -bottom-2 -left-2 z-20 px-3 py-1.5 rounded-full border border-border bg-card/90 backdrop-blur-sm shadow-lg text-xs font-semibold flex items-center gap-1.5"
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
              >
                <span>🔗</span> Blockchain
              </motion.div>

              <motion.div
                className="absolute top-1/2 -right-6 z-20 px-3 py-1.5 rounded-full border border-border bg-card/90 backdrop-blur-sm shadow-lg text-xs font-semibold flex items-center gap-1.5"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              >
                <span>📱</span> Mobile
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <a href="#about">
          <ArrowDown className="h-6 w-6 text-muted-foreground animate-bounce" />
        </a>
      </motion.div>
    </section>
  );
};

export default HeroSection;
