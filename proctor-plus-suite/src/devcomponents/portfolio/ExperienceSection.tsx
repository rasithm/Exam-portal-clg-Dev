//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devcomponents\portfolio\ExperienceSection.tsx
import { motion } from "framer-motion";
import { getPortfolioData } from "@/hooks/usePortfolioData";
import { Briefcase } from "lucide-react";

const ExperienceSection = () => {
  const { experience } = getPortfolioData();

  return (
    <section id="experience" className="py-24 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ fontFamily: "Space Grotesk" }}
        >
          Professional <span className="text-gradient">Experience</span>
        </motion.h2>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          {experience.map((exp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative md:pl-16 mb-8"
            >
              <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-accent border-4 border-background hidden md:block" />

              <div className="p-6 rounded-2xl border border-border bg-card">
                <div className="flex items-start gap-3 mb-3">
                  <Briefcase className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg">{exp.role}</h3>
                    <p className="text-sm text-muted-foreground">{exp.company} · {exp.period}</p>
                  </div>
                </div>
                <ul className="space-y-2 ml-8">
                  {exp.details.map((d, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-accent mt-1">▸</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
