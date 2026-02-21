//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devcomponents\portfolio\ProjectsSection.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPortfolioData } from "@/hooks/usePortfolioData";
import { ExternalLink, Github, X } from "lucide-react";
import { Button } from "@/devcomponents/ui/button";

const ProjectsSection = () => {
  const { projects } = getPortfolioData();
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ fontFamily: "Space Grotesk" }}
        >
          Featured <span className="text-gradient">Projects</span>
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(i)}
              className="group cursor-pointer rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:shadow-accent/5 transition-all"
            >
              <div className={`h-2 bg-gradient-to-r ${p.color}`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-accent transition-colors">
                      {p.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">{p.subtitle}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{p.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.tech.slice(0, 4).map((t) => (
                    <span key={t} className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
                      {t}
                    </span>
                  ))}
                  {p.tech.length > 4 && (
                    <span className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground">
                      +{p.tech.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {selected !== null && projects[selected] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card rounded-2xl border border-border max-w-lg w-full p-6 relative"
              >
                <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
                <div className={`h-1.5 rounded-full bg-gradient-to-r ${projects[selected].color} mb-4`} />
                <h3 className="font-bold text-xl mb-1">{projects[selected].title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{projects[selected].subtitle}</p>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{projects[selected].description}</p>
                {projects[selected].impact && (
                  <p className="text-sm text-accent mb-4 italic">💡 {projects[selected].impact}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {projects[selected].tech.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{t}</span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button asChild size="sm" className="rounded-full">
                    <a href={projects[selected].github} target="_blank" rel="noreferrer">
                      <Github className="mr-1.5 h-4 w-4" /> GitHub
                    </a>
                  </Button>
                  {projects[selected].live && (
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <a href={projects[selected].live} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1.5 h-4 w-4" /> Live Demo
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ProjectsSection;
