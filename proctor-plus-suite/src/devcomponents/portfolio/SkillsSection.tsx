//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devcomponents\portfolio\SkillsSection.tsx
import { motion } from "framer-motion";
// import { getPortfolioData } from "@/hooks/usePortfolioData";
import { Code2, Server, Blocks, Smartphone, Cloud, Wrench } from "lucide-react";
import { usePortfolioData } from "@/hooks/usePortfolioData";

const iconMap: Record<string, typeof Code2> = {
  Frontend: Code2,
  Backend: Server,
  "Blockchain / Web3": Blocks,
  Mobile: Smartphone,
  "Tools & Cloud": Cloud,
  Other: Wrench,
};

const SkillsSection = () => {
  // const { skills } = getPortfolioData();
  const { data } = usePortfolioData();
  if (!data) return null;
  const { skills } = data;

  return (
    <section id="skills" className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ fontFamily: "Space Grotesk" }}
        >
          My <span className="text-gradient">Skills</span>
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(skills).map(([category, items], idx) => {
            const Icon = iconMap[category] || Wrench;
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:shadow-accent/5 transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-accent/10 transition-colors">
                    <Icon className="h-5 w-5 text-primary group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="font-semibold text-base">{category}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:text-white transition-colors cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
