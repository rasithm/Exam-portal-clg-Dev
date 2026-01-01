//C:\Users\nazeer\Desktop\Exam-edit\Exam-portal\Exam-Portal\proctor-plus-suite\src\hooks\useExamSecurity.ts
import { useEffect, useCallback, useState } from "react";
import { toast } from "@/hooks/use-toast";

interface SecurityViolation {
  type: string;
  timestamp: Date;
  details?: string;
}

export function useExamSecurity(enabled: boolean = true) {
  const [violations, setViolations] = useState<SecurityViolation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  const addViolation = useCallback((type: string, details?: string) => {
    setViolations((prev) => [...prev, { type, timestamp: new Date(), details }]);
    toast({
      title: "Security Warning",
      description: `${type} detected. This action has been logged.`,
      variant: "destructive",
    });
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Disable context menu (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("Right-click attempt");
    };

    // Disable copy/paste and keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        addViolation("Dev tools shortcut", e.key);
        return;
      }

      // Disable Ctrl+C, Ctrl+V, Ctrl+X (outside editor)
      if (e.ctrlKey && ["c", "v", "x"].includes(e.key.toLowerCase())) {
        const target = e.target as HTMLElement;
        const isInEditor = target.closest(".monaco-editor");
        if (!isInEditor) {
          e.preventDefault();
          addViolation("Copy/Paste attempt outside editor");
        }
      }

      // Disable Ctrl+P (print)
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
      }
    };

    // Track tab/window visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        addViolation("Tab switch detected");
      }
    };

    // Track fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && enabled) {
        addViolation("Exited fullscreen mode");
      }
    };

    // Disable text selection outside editor
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      const isInEditor = target.closest(".monaco-editor");
      if (!isInEditor) {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("selectstart", handleSelectStart);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, [enabled, addViolation]);

  return {
    violations,
    isFullscreen,
    tabSwitchCount,
    enterFullscreen,
    exitFullscreen,
  };
}
