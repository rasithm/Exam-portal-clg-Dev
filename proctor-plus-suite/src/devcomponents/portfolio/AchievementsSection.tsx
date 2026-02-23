//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devcomponents\portfolio\AchievementsSection.tsx
import { motion } from "framer-motion";
// import { getPortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioData } from "@/hooks/usePortfolioData";
const AchievementsSection = () => {
  // const { achievements } = getPortfolioData();

  
  const { data } = usePortfolioData();
  if (!data) return null;
  const { achievements } = data;

  return (
    <section id="achievements" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ fontFamily: "Space Grotesk" }}
        >
          Achievements & <span className="text-gradient">Awards</span>
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {achievements.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="text-center p-6 rounded-2xl border border-border bg-card hover:border-accent/40 transition-colors"
            >
              <span className="text-4xl mb-3 block">{a.icon}</span>
              <h3 className="font-bold text-sm mb-1">{a.title}</h3>
              <p className="text-xs text-muted-foreground">{a.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection;
