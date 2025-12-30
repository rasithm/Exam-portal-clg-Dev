//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\components\compiler\TestCaseCard.tsx
import { Badge } from "@/components/uis/badge";
import { Button } from "@/components/uis/button";
import { Card } from "@/components/uis/card";
import { EyeOff, CheckCircle2, XCircle, Clock, Play, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface TestCaseCardProps {
  index: number;
  inputs: string[];
  expectedOutput: string;
  isHidden?: boolean;
  status?: "pending" | "passed" | "failed";
  actualOutput?: string;
  showDetails?: boolean;
  onRunTestCase?: (index: number) => void;
  isRunning?: boolean;
}

export function TestCaseCard({
  index,
  inputs,
  expectedOutput,
  isHidden = false,
  status = "pending",
  actualOutput,
  showDetails = true,
  onRunTestCase,
  isRunning = false,
}: TestCaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const statusConfig = {
    pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
    passed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    failed: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <Card className={`overflow-hidden transition-all ${statusConfig[status].bg}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <StatusIcon className={`w-4 h-4 ${statusConfig[status].color}`} />
            <span className="font-medium text-sm">Test Case {index + 1}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!isHidden && onRunTestCase && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRunTestCase(index)}
              disabled={isRunning}
              className="h-7 px-2 text-xs"
            >
              {isRunning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Run
                </>
              )}
            </Button>
          )}
          {isHidden && (
            <Badge variant="secondary" className="text-xs gap-1">
              <EyeOff className="w-3 h-3" />
              Hidden
            </Badge>
          )}
        </div>
      </div>

      {showDetails && !isHidden && isExpanded && (
        <div className="p-4 space-y-3 text-sm">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Input{inputs.length > 1 ? "s" : ""}
            </label>
            <div className="mt-1 space-y-1">
              {inputs.map((input, i) => (
                <pre
                  key={i}
                  className="bg-muted/50 rounded-md px-3 py-2 font-mono text-xs overflow-x-auto"
                >
                  {input}
                </pre>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Expected Output
            </label>
            <pre className="mt-1 bg-muted/50 rounded-md px-3 py-2 font-mono text-xs overflow-x-auto">
              {expectedOutput}
            </pre>
          </div>

          {actualOutput !== undefined && status !== "pending" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Your Output
              </label>
              <pre
                className={`mt-1 rounded-md px-3 py-2 font-mono text-xs overflow-x-auto ${
                  status === "passed"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {actualOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
