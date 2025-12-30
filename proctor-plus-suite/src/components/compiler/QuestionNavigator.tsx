//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\components\compiler\QuestionNavigator.tsx
import { Button } from "@/components/uis/button";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  title: string;
  completed?: boolean;
  current?: boolean;
}

interface QuestionNavigatorProps {
  questions: Question[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function QuestionNavigator({
  questions,
  currentIndex,
  onNavigate,
  onPrevious,
  onNext,
}: QuestionNavigatorProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="h-8"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {questions.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={currentIndex === questions.length - 1}
          className="h-8"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => onNavigate(i)}
            className={cn(
              "relative flex items-center justify-center w-full aspect-square rounded-md text-sm font-medium transition-all",
              i === currentIndex
                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card"
                : q.completed
                ? "bg-success/20 text-success hover:bg-success/30"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {q.completed ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <span>{i + 1}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
