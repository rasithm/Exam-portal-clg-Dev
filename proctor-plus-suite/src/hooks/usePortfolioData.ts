//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\hooks\usePortfolioData.ts
import { useState, useCallback , useEffect} from "react";
import {
  personalInfo as defaultPersonalInfo,
  skills as defaultSkills,
  projects as defaultProjects,
  experience as defaultExperience,
  achievements as defaultAchievements,
} from "@/data/portfolio-data";


import { baseUrl } from "@/constant/Url";

const API_BASE = baseUrl || "http://localhost:5000";

// ─── Types ───────────────────────────────────────────────
export type PortfolioPersonalInfo = typeof defaultPersonalInfo & {
  photo?: string; // base64 or URL
};

export type PortfolioProject = {
  title: string;
  subtitle: string;
  description: string;
  tech: string[];
  github: string;
  live?: string;
  impact?: string;
  color: string;
};

export type PortfolioExperience = {
  role: string;
  company: string;
  period: string;
  details: string[];
};

export type PortfolioAchievement = {
  icon: string;
  title: string;
  description: string;
};

export type PortfolioSkills = Record<string, string[]>;



// ─── Storage key ─────────────────────────────────────────
// const STORAGE_KEY = "rasith_portfolio_data";

// const defaultData: PortfolioData = {
//   personalInfo: { ...defaultPersonalInfo, photo: undefined },
//   skills: defaultSkills,
//   projects: defaultProjects,
//   experience: defaultExperience,
//   achievements: defaultAchievements,
// };

// function loadData(): PortfolioData {
//   try {
//     const stored = localStorage.getItem(STORAGE_KEY);
//     if (!stored) return defaultData;
//     const parsed = JSON.parse(stored);
    
//     return {
//       personalInfo: { ...defaultData.personalInfo, ...parsed.personalInfo },
//       skills: parsed.skills ?? defaultData.skills,
//       projects: parsed.projects ?? defaultData.projects,
//       experience: parsed.experience ?? defaultData.experience,
//       achievements: parsed.achievements ?? defaultData.achievements,
//     };
//   } catch {
//     return defaultData;
//   }
// }

// function saveData(data: PortfolioData) {
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
//   } catch {
    
//   }
// }

// ─── Hook ────────────────────────────────────────────────



export interface PortfolioData {
  personalInfo: any;
  skills: Record<string, string[]>;
  projects: any[];
  experience: any[];
  achievements: any[];
}

export function usePortfolioData() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  // FETCH
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/developer/portfolio`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        // setData(json);
        setData({
          personalInfo: json.personalInfo || {},
          skills: json.skills || {},
          projects: json.projects || [],
          experience: json.experience || [],
          achievements: json.achievements || [],
        });
      } catch (err) {
        console.error("Portfolio fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  // UPDATE
  const update = useCallback(async (payload: Partial<PortfolioData>) => {
    const res = await fetch(`${API_BASE}/api/developer/portfolio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message);

    // Re-fetch after update
    const fresh = await fetch(`${API_BASE}/api/developer/portfolio`, {
      credentials: "include",
    });
    const freshData = await fresh.json();
    setData({
      personalInfo: freshData.personalInfo || {},
      skills: freshData.skills || {},
      projects: freshData.projects || [],
      experience: freshData.experience || [],
      achievements: freshData.achievements || [],
    });
  }, []);

  // RESET (alert only)
  const reset = useCallback(async () => {
    await fetch(`${API_BASE}/api/developer/reset`, {
      method: "POST",
      credentials: "include",
    });
  }, []);

  return { data, update, reset, loading };
}
