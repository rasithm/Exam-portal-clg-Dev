//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\components\compiler\ExamStartModal.tsx
import { Button } from "@/components/uis/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/uis/dialog";
import { ThemeSelector, EditorTheme } from "./ThemeSelector";
import { Shield, Monitor, Clock, AlertTriangle } from "lucide-react";

interface ExamStartModalProps {
  open: boolean;
  examTitle: string;
  duration: number;
  questionCount: number;
  selectedTheme: EditorTheme;
  onThemeChange: (theme: EditorTheme) => void;
  onStart: () => void;
}

export function ExamStartModal({
  open,
  examTitle,
  duration,
  questionCount,
  selectedTheme,
  onThemeChange,
  onStart,
}: ExamStartModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-xl">{examTitle}</DialogTitle>
          <DialogDescription>
            Please read the following instructions carefully before starting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Exam Info */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">{duration} minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Monitor className="w-4 h-4 text-primary" />
              <span className="font-medium">{questionCount} questions</span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <Shield className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Proctored Exam Mode</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Exam runs in fullscreen mode</li>
                <li>• Copy/paste disabled outside code editor</li>
                <li>• Tab switching will be tracked</li>
                <li>• Right-click and dev tools are disabled</li>
              </ul>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Editor Theme</label>
            <ThemeSelector value={selectedTheme} onChange={onThemeChange} />
            <p className="text-xs text-muted-foreground">
              Choose your preferred code editor theme before starting.
            </p>
          </div>

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Once started, the timer cannot be paused. Make sure you have a stable internet connection.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onStart} size="lg" className="w-full">
            <Monitor className="w-4 h-4 mr-2" />
            Enter Fullscreen & Start Exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
