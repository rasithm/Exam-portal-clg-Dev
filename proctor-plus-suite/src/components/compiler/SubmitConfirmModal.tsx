//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\components\compiler\SubmitConfirmModal.tsx
import { Button } from "@/components/uis/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/uis/dialog";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface Question {
  id: number;
  title: string;
  completed: boolean;
}

interface SubmitConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  questions: Question[];
}

export function SubmitConfirmModal({
  open,
  onClose,
  onConfirm,
  questions,
}: SubmitConfirmModalProps) {
  const completedCount = questions.filter((q) => q.completed).length;
  const incompleteCount = questions.length - completedCount;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Submit Exam?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to submit your exam? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {/* Summary */}
          <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm">
                <strong>{completedCount}</strong> completed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm">
                <strong>{incompleteCount}</strong> incomplete
              </span>
            </div>
          </div>

          {/* Question List */}
          <div className="max-h-48 overflow-auto space-y-2">
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30"
              >
                <span className="text-sm truncate">{q.title}</span>
                {q.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {incompleteCount > 0 && (
            <p className="text-xs text-warning flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              You have {incompleteCount} incomplete question(s).
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Continue Exam
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Submit Exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
