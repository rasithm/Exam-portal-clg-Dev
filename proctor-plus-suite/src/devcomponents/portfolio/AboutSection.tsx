//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devcomponents\portfolio\AboutSection.tsx
import { motion } from "framer-motion";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { GraduationCap, Award, Briefcase, Code2 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const AboutSection = () => {
  const { data } = usePortfolioData();
  if (!data) return null;

  const { personalInfo, projects } = data;

  // const stats = [
  //   { icon: Code2, label: `${getPortfolioData().projects.length}+ Projects`, sub: "Full-Stack & Blockchain" },
  //   { icon: Briefcase, label: "10+ Skills", sub: "Across domains" },
  //   { icon: Award, label: "SIH'23", sub: "Participant" },
  //   { icon: GraduationCap, label: "1st Prize", sub: "Sathakathon" },
  // ];
  const stats = [
    { icon: Code2, label: `${projects.length}+ Projects`, sub: "Full-Stack & Blockchain" },
    { icon: Briefcase, label: "10+ Skills", sub: "Across domains" },
    { icon: Award, label: "SIH'23", sub: "Participant" },
    { icon: GraduationCap, label: "1st Prize", sub: "Sathakathon" },
  ];

  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          style={{ fontFamily: "Space Grotesk" }}
        >
          About <span className="text-gradient">Me</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          {personalInfo.objective}
        </motion.p>

        {/* Education & Certification */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl border border-border bg-card"
          >
            <GraduationCap className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-1">{personalInfo.education.degree}</h3>
            <p className="text-sm text-muted-foreground">{personalInfo.education.institution}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{personalInfo.education.expected}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl border border-border bg-card"
          >
            <Award className="h-8 w-8 text-accent mb-3" />
            <h3 className="font-semibold text-lg mb-1">{personalInfo.certification.title}</h3>
            <p className="text-sm text-muted-foreground">{personalInfo.certification.org}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{personalInfo.certification.duration}</p>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center p-5 rounded-2xl border border-border bg-card hover:border-accent/40 transition-colors"
            >
              <s.icon className="h-6 w-6 mx-auto mb-2 text-accent" />
              <p className="font-bold text-lg">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
