//C:\Users\nazeer\Desktop\examPortal-!index\Exam-Portal\proctor-plus-suite\src\hooks\usePortfolioData.ts
import { useState, useCallback } from "react";
import {
  personalInfo as defaultPersonalInfo,
  skills as defaultSkills,
  projects as defaultProjects,
  experience as defaultExperience,
  achievements as defaultAchievements,
} from "@/data/portfolio-data";

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

export interface PortfolioData {
  personalInfo: PortfolioPersonalInfo;
  skills: PortfolioSkills;
  projects: PortfolioProject[];
  experience: PortfolioExperience[];
  achievements: PortfolioAchievement[];
}

// ─── Storage key ─────────────────────────────────────────
const STORAGE_KEY = "rasith_portfolio_data";

// ─── Defaults ────────────────────────────────────────────
const defaultData: PortfolioData = {
  personalInfo: { ...defaultPersonalInfo, photo: undefined },
  skills: defaultSkills,
  projects: defaultProjects,
  experience: defaultExperience,
  achievements: defaultAchievements,
};

function loadData(): PortfolioData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultData;
    const parsed = JSON.parse(stored);
    // Deep merge with defaults so new fields are always present
    return {
      personalInfo: { ...defaultData.personalInfo, ...parsed.personalInfo },
      skills: parsed.skills ?? defaultData.skills,
      projects: parsed.projects ?? defaultData.projects,
      experience: parsed.experience ?? defaultData.experience,
      achievements: parsed.achievements ?? defaultData.achievements,
    };
  } catch {
    return defaultData;
  }
}

function saveData(data: PortfolioData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage quota exceeded – silently fail
  }
}

// ─── Hook ────────────────────────────────────────────────
export function usePortfolioData() {
  const [data, setData] = useState<PortfolioData>(loadData);

  const update = useCallback((patch: Partial<PortfolioData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      saveData(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(defaultData);
  }, []);

  return { data, update, reset };
}

// ─── Singleton read (for sections that just need to read) ─
export function getPortfolioData(): PortfolioData {
  return loadData();
}
