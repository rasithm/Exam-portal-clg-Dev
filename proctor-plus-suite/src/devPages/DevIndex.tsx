//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devPages\DevIndex.tsx
import Navbar from "@/devcomponents/portfolio/Navbar";
import HeroSection from "@/devcomponents/portfolio/HeroSection";
import AboutSection from "@/devcomponents/portfolio/AboutSection";
import SkillsSection from "@/devcomponents/portfolio/SkillsSection";
import ProjectsSection from "@/devcomponents/portfolio/ProjectsSection";
import ExperienceSection from "@/devcomponents/portfolio/ExperienceSection";
import AchievementsSection from "@/devcomponents/portfolio/AchievementsSection";
import ContactSection from "@/devcomponents/portfolio/ContactSection";
import Footer from "@/devcomponents/portfolio/Footer";

const Index = () => (
  <div className="developer-theme min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <AboutSection />
    <SkillsSection />
    <ProjectsSection />
    <ExperienceSection />
    <AchievementsSection />
    <ContactSection />
    <Footer />
  </div>
);

export default Index;
