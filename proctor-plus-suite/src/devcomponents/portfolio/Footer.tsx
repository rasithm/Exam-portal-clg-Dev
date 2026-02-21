//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\devcomponents\portfolio\Footer.tsx
import { personalInfo } from "@/data/portfolio-data";

const Footer = () => (
  <footer className="py-8 px-6 border-t border-border text-center">
    <p className="text-sm text-muted-foreground">
      © {new Date().getFullYear()} {personalInfo.name}. Built with React & Framer Motion.
    </p>
    <a
      href="/developer/login"
      className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors mt-2 inline-block"
    >
      Developer Access
    </a>
  </footer>
);

export default Footer;
