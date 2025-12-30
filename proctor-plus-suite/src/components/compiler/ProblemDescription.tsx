//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\components\compiler\ProblemDescription.tsx
import { Badge } from "@/components/uis/badge";
import { Button } from "@/components/uis/button";
import { TestCaseCard } from "./TestCaseCard";
import { ChevronDown, ChevronUp, Clock, Zap } from "lucide-react";
import { useState } from "react";
import { TestCaseResultsTable } from "./TestCaseResultsTable";

interface TestCase {
  inputs: string[];
  expectedOutput: string;
  isHidden: boolean;
  status?: "pending" | "passed" | "failed";
  actualOutput?: string;
}

interface ProblemDescriptionProps {
  examTitle: string;
  questionTitle: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  evaluationMode?: "Strict" | "Non-Strict";
  shortDescription: string;
  longDescription?: string;
  inputFormat: string;
  outputFormat: string;
  testCases: TestCase[];
  attemptLimit?: number;
  attemptsUsed?: number;
  onRunTestCase?: (index: number) => void;
  runningTestCaseIndex?: number;
  showResultsTable?: boolean;
  tableResults?: {
    sno: number;
    name: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    status: "pending" | "passed" | "failed";
  }[];
}

const difficultyColors = {
  Easy: "bg-success/20 text-success",
  Medium: "bg-warning/20 text-warning",
  Hard: "bg-destructive/20 text-destructive",
};

export function ProblemDescription({
  examTitle,
  questionTitle,
  difficulty = "Medium",
  evaluationMode = "Strict",
  shortDescription,
  longDescription,
  inputFormat,
  outputFormat,
  testCases,
  attemptLimit,
  attemptsUsed = 0,
  onRunTestCase,
  runningTestCaseIndex,
  showResultsTable = false,
  tableResults = [],
  
}: ProblemDescriptionProps) {
  const [showTestCases, setShowTestCases] = useState(true);

  const visibleTestCases = testCases.filter((tc) => !tc.isHidden);
  const hiddenCount = testCases.filter((tc) => tc.isHidden).length;

  // Calculate minimum height for test cases section to prevent layout shift
  const testCaseSectionMinHeight = visibleTestCases.length * 120 + (hiddenCount > 0 ? 60 : 0);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex-shrink-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {examTitle}
        </p>
        <h1 className="text-xl font-bold text-foreground">{questionTitle}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge className={difficultyColors[difficulty]}>{difficulty}</Badge>
          <Badge variant="outline" className="gap-1">
            <Zap className="w-3 h-3" />
            {evaluationMode}
          </Badge>
          {attemptLimit && (
            <Badge variant="secondary" className="gap-1  bg-gray-800 text-cyan-50 hover:bg-gray-800 hover:text-cyan-50">
              <Clock className="w-3 h-3" />
              {attemptsUsed}/{attemptLimit} attempts
            </Badge>
          )}
        </div>
      </div>

      {/* Content - flex-1 for remaining space */}
      <div className="flex-1 overflow-auto p-6 space-y-6 scrollbar-thin">
        {/* Short Description - Always visible */}
        <section className="flex-shrink-0">
          <h2 className="text-sm font-semibold text-foreground mb-2">Description</h2>
          <p className="text-sm font-bold text-foreground leading-relaxed mb-3">
            {shortDescription}
          </p>
          {longDescription && (
            <div className="mt-3 prose prose-sm prose-slate dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {longDescription}
              </p>
            </div>
          )}
        </section>

        {/* Input/Output Format */}
        <section className="grid md:grid-cols-2 gap-4 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">Input Format</h2>
            <pre className="text-xs bg-muted/50 rounded-md p-3 font-mono whitespace-pre-wrap">
              {inputFormat}
            </pre>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">Output Format</h2>
            <pre className="text-xs bg-muted/50 rounded-md p-3 font-mono whitespace-pre-wrap">
              {outputFormat}
            </pre>
          </div>
        </section>

        {/* Test Case Results Table - Shown after running */}
        {showResultsTable && tableResults.length > 0 && (
          <section className="flex-shrink-0">
            <h2 className="text-sm font-semibold text-foreground mb-3">Test Results</h2>
            <TestCaseResultsTable results={tableResults} />
          </section>
        )}

        {/* Test Cases Section - Fixed height container to prevent layout shift */}
        <section 
          className="flex-shrink-0"
          style={{ minHeight: testCaseSectionMinHeight }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Test Cases
              {hiddenCount > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({hiddenCount} hidden)
                </span>
              )}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTestCases(!showTestCases)}
              className="h-7 text-xs"
            >
              {showTestCases ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Hide All
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Show All
                </>
              )}
            </Button>
          </div>

          {/* Wrapper with visibility toggle - preserves space */}
          <div 
            className={`space-y-3 transition-opacity duration-200 ${
              showTestCases ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={{ visibility: showTestCases ? "visible" : "hidden" }}
          >
            {visibleTestCases.map((tc, i) => (
              <TestCaseCard
                key={i}
                index={i}
                inputs={tc.inputs}
                expectedOutput={tc.expectedOutput}
                isHidden={tc.isHidden}
                status={tc.status}
                actualOutput={tc.actualOutput}
                onRunTestCase={onRunTestCase}
                isRunning={runningTestCaseIndex === i}
              />
            ))}
            {/* {showResultsTable && <TestCaseResultsTable results={tableResults} />} */}
            {hiddenCount > 0 && (
              <TestCaseCard
                index={visibleTestCases.length}
                inputs={[]}
                expectedOutput=""
                isHidden={true}
                showDetails={false}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
