//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\components\compiler\TestCaseResultsTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/uis/table";
import { Badge } from "@/components/uis/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface TestCaseResult {
  sno: number;
  name: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: "pending" | "passed" | "failed";
}

interface TestCaseResultsTableProps {
  results: TestCaseResult[];
}

export function TestCaseResultsTable({ results }: TestCaseResultsTableProps) {
  const statusConfig = {
    pending: { icon: Clock, color: "text-muted-foreground", badge: "secondary" as const },
    passed: { icon: CheckCircle2, color: "text-success", badge: "default" as const },
    failed: { icon: XCircle, color: "text-destructive", badge: "destructive" as const },
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-16 text-xs">S.No</TableHead>
            <TableHead className="text-xs">Test Case</TableHead>
            <TableHead className="text-xs">Input</TableHead>
            <TableHead className="text-xs">Expected</TableHead>
            <TableHead className="text-xs">Actual</TableHead>
            <TableHead className="w-24 text-xs text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => {
            const StatusIcon = statusConfig[result.status].icon;
            return (
              <TableRow key={result.sno}>
                <TableCell className="font-medium text-xs">{result.sno}</TableCell>
                <TableCell className="text-xs font-medium">{result.name}</TableCell>
                <TableCell className="font-mono text-xs max-w-32 truncate" title={result.input}>
                  {result.input}
                </TableCell>
                <TableCell className="font-mono text-xs max-w-32 truncate" title={result.expectedOutput}>
                  {result.expectedOutput}
                </TableCell>
                <TableCell className="font-mono text-xs max-w-32 truncate" title={result.actualOutput}>
                  {result.actualOutput || "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={statusConfig[result.status].badge} 
                    className="gap-1 text-xs"
                  >
                    <StatusIcon className={`w-3 h-3 ${statusConfig[result.status].color}`} />
                    {result.status === "passed" ? "Pass" : result.status === "failed" ? "Fail" : "Pending"}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
