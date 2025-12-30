//C:\Users\nazeer\Desktop\compilor-v3\code-compiler-studio\src\components\compiler\SubmitResultModal.tsx

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/uis/dialog";
import { Button } from "@/components/uis/button";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface SubmitResultModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  totalTestCases: number;
  passedTestCases: number;
  failedTestCases: number;
}

export function SubmitResultModal({
  open,
  onClose,
  onConfirmSubmit,
  totalTestCases,
  passedTestCases,
  failedTestCases,
}: SubmitResultModalProps) {
  const allPassed = failedTestCases === 0;
  const majorPassed = passedTestCases > failedTestCases;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            allPassed 
              ? "bg-success/20" 
              : majorPassed 
                ? "bg-warning/20" 
                : "bg-destructive/20"
          }`}>
            {allPassed ? (
              <CheckCircle2 className="w-8 h-8 text-success" />
            ) : majorPassed ? (
              <AlertTriangle className="w-8 h-8 text-warning" />
            ) : (
              <XCircle className="w-8 h-8 text-destructive" />
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {allPassed 
              ? "All Test Cases Passed!" 
              : majorPassed 
                ? "Most Test Cases Passed" 
                : "Test Cases Failed"}
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <div className="flex justify-center gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{passedTestCases}</div>
                <div className="text-xs text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{failedTestCases}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{totalTestCases}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
            <p className="mt-4 text-sm">
              {allPassed 
                ? "Great job! Your solution passed all test cases." 
                : failedTestCases > 0 
                  ? `${failedTestCases} test case(s) failed. Do you still want to submit?`
                  : "Some test cases need attention."}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-center">
          <Button variant="outline" onClick={onClose}>
            {allPassed ? "Close" : "Go Back & Fix"}
          </Button>
          <Button 
            onClick={onConfirmSubmit}
            className={allPassed ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}
          >
            {allPassed ? "Submit Solution" : "Submit Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
