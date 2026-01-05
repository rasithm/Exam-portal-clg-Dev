//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\components\compiler\CodeEditor.tsx
import Editor, { Monaco } from "@monaco-editor/react";
import { useState, useRef , useEffect} from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/uis/select";
import { Button } from "@/components/uis/button";
import { Textarea } from "@/components/uis/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/uis/tabs";
import { Play, Send, Trash2, Loader2, Terminal, TestTube2 } from "lucide-react";
import { EditorTheme } from "./ThemeSelector";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/uis/resizable";
import { LanguageIcon } from "./LanguageIcons";
import type { editor } from "monaco-editor";
import { toast } from "@/hooks/use-toast";
import { TestCaseCard } from "./TestCaseCard";
import { TestCaseResultsTable } from "./TestCaseResultsTable";

interface CodeEditorProps {
  languages: string[];
  onRun?: (code: string, language: string, customInput?: string) => void;
  onSubmit?: (code: string, language: string) => void;
  isRunning?: boolean;
  output?: string;
  editorTheme?: EditorTheme;
  testCaseStatuses?: { index: number; status: "passed" | "failed" }[];
}

const languageMap: Record<string, string> = {
  "Python": "python",
  "Java": "java",
  "C++": "cpp",
  "JavaScript": "javascript",
  "C": "c",
};

const monacoThemeMap: Record<EditorTheme, string> = {
  "light": "light",
  "vs-dark": "vs-dark",
  "vscode-dark": "vs-dark",
  "gray": "gray-theme",
};

const defaultCode: Record<string, string> = {
  python: '# Write your solution here\n\ndef solution():\n    pass\n',
  java: '// Write your solution here\n\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}',
  cpp: '// Write your solution here\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}',
  javascript: '// Write your solution here\n\nfunction solution() {\n    \n}\n',
  c: '// Write your solution here\n\n#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}',
};

export function CodeEditor({ 
  languages, 
  onRun, 
  onSubmit, 
  isRunning = false,
  output = "",
  editorTheme = "vs-dark"
}: CodeEditorProps) {

  const [selectedLanguage, setSelectedLanguage] = useState(() => languages?.[0] ?? "Python");

  const [code, setCode] = useState(defaultCode[languageMap[selectedLanguage]] || "");
  const [customInput, setCustomInput] = useState("");
  const [outputTab, setOutputTab] = useState<"output" | "custom">("output");
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  

    
  
  const [customInputs, setCustomInputs] = useState<string[]>([""]);
  const [detectedInputs, setDetectedInputs] = useState<{ label: string }[]>([]);
  const [inputRequired, setInputRequired] = useState(false);

  useEffect(() => {
    const needsInput = /input\(|fs\.readFileSync|Scanner|readline/.test(code);
    setInputRequired(needsInput);

    if (!needsInput) {
      setDetectedInputs([]);
      return;
    }

    const nextCallMatches = [...code.matchAll(/(?:const|let|var)?\s*(\w+)?\s*=?\s*(?:Number\()?next\(\)?/g)];

    let inputs: { label: string }[] = [];

    // Track inputs with variable names
    nextCallMatches.forEach((match, i) => {
      const varName = match[1]?.trim();
      if (varName) {
        inputs.push({ label: `${varName}:` });
      } else {
        inputs.push({ label: `Input ${i + 1}:` });
      }
    });

    // Fallback: count raw next() if no matches
    if (inputs.length === 0) {
      const fallbackCount = (code.match(/next\(\)/g) || []).length;
      for (let i = 0; i < fallbackCount; i++) {
        inputs.push({ label: `Input ${i + 1}:` });
      }
    }

    setDetectedInputs(inputs);
    setCustomInputs(Array(inputs.length).fill(""));
  }, [code]);



  const customInputCount = customInputs.length;
  const isDarkMode = editorTheme !== "light";
  const defaultLang = languages?.[0] || "Python";


  useEffect(() => {
    if (languages && languages.length > 0) {
      setSelectedLanguage(languages[0]);
      setCode(defaultCode[languageMap[languages[0]]] || "");
    }
  }, [languages]);

  const handleCustomInputChange = (index: number, value: string) => {
    setCustomInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      if (index === prev.length - 1 && value.trim() !== "") {
        next.push("");
      }
      return next;
    });
  };

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    setTimeout(() => {
      editor.layout();
    }, 100);
  };

  if (!languages || languages.length === 0) {
    return <div className="p-4 text-muted-foreground">No languages available.</div>;
    console.warn("Language mismatch:", { selectedLanguage, languageMap, available: languages });

  }
  if (!languageMap[selectedLanguage]) {
    const fallback = Object.keys(languageMap).find((key) => key.toLowerCase() === selectedLanguage.toLowerCase());
    if (fallback) setSelectedLanguage(fallback);
  }



  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setCode(defaultCode[languageMap[lang]] || "");
  };

  const handleClear = () => {
    setCode(defaultCode[languageMap[selectedLanguage]] || "");
  };

  const handleRunWithCustomInput = () => {
    const formattedInput = customInputs.filter(i => i.trim()).join("\n");

    if (!formattedInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please fill in required inputs before running.",
        variant: "destructive",
      });
      return;
    }

    onRun?.(code, selectedLanguage, formattedInput);
  };

  const handleRunClick = () => {
    if (inputRequired) {
      toast({
        title: "Custom Input Required",
        description: "This code requires input. Please provide input values under the Custom Input tab.",
        variant: "destructive",
      });
      return;
    }
    onRun?.(code, selectedLanguage);
  };


  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border ">
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
              
              <div className="flex items-center gap-2 text-sm">
                {languages.map((lang) => (
                  <Button
                    key={lang}
                    variant={selectedLanguage === lang ? "secondary" : "ghost"}
                    className="h-8 px-3 flex items-center gap-2"
                    onClick={() => handleLanguageChange(lang)}
                  >
                    <LanguageIcon language={lang} className="w-4 h-4" />
                    {lang}
                  </Button>
                ))}
              </div>




              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClear}
                  className="h-8 px-3 text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleRunClick}
                  disabled={isRunning || inputRequired}
                  className="h-8 px-4 bg-gray-800 text-cyan-50 hover:bg-gray-800 hover:text-cyan-50"
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  Run 
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleRunClick}
                  disabled={isRunning || inputRequired}
                  className="h-8 px-4 bg-gray-800 text-cyan-50 hover:bg-gray-800 hover:text-cyan-50"
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-1" />
                  )}
                  Run All
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => onSubmit?.(code, selectedLanguage)}
                  disabled={isRunning}
                  className="h-8 px-4"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Submit
                </Button>
              </div>
            </div>

            {/* Editor - Full height */}
            <div className="flex-1 min-h-0 ">
              <div className="monaco-wrapper">
                <Editor
                  height="100%"
                  language={languageMap[selectedLanguage]}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme={editorTheme === "gray" ? "gray-theme" : monacoThemeMap[editorTheme]}
                  // onMount={handleEditorMount}
                  
                  onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                    setTimeout(() => editor.layout(), 100);
                  }}

                  
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "JetBrains Mono, monospace",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: "off",
                    scrollbar: {
                      horizontal: "auto",
                      vertical: "auto",
                      alwaysConsumeMouseWheel: false,
                    },
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    renderWhitespace: "none",
                    renderControlCharacters: false,
                    contextmenu: true,
                  
                  }}
                />
              </div>
              
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={15}>
          {/* Output Console with Tabs */}
          <div className="flex flex-col h-full bg-card">
            <Tabs value={outputTab} onValueChange={(v) => setOutputTab(v as "output" | "custom")} className="flex flex-col h-full">
              <div className="flex items-center justify-between px-2 border-b border-border bg-muted/30">
                <TabsList className="h-9 bg-transparent">
                  <TabsTrigger value="output" className="text-xs gap-1.5 data-[state=active]:bg-muted">
                    <Terminal className="w-3.5 h-3.5" />
                    Output
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="text-xs gap-1.5 relative data-[state=active]:bg-muted">
                    <TestTube2 className="w-3.5 h-3.5" />
                    Custom Input
                    {code && /input\(|fs\.readFileSync|Scanner|readline/.test(code) && customInputs.every(i => !i.trim()) && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    )}
                  </TabsTrigger>

                </TabsList>
                {outputTab === "custom" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRunWithCustomInput}
                    disabled={isRunning}
                    className="h-7 px-3 text-xs"
                  >
                    {isRunning ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 mr-1" />
                    )}
                    Run with Input
                  </Button>
                )}
              </div>
              
              <TabsContent value="output" className="flex-1 m-0 overflow-auto">
                <div className="h-full overflow-auto p-4 font-mono text-sm scrollbar-thin">
                  {output ? (
                    <pre className="whitespace-pre-wrap text-foreground">{output}</pre>
                  ) : (
                    <span className="text-muted-foreground">Run your code to see output...</span>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="flex-1 m-0 overflow-hidden p-2">
                
                <div className={`h-full overflow-auto rounded-md p-3 font-mono text-sm ${isDarkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-muted/30 border-muted'} border`}>
                  {detectedInputs.map((input, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium min-w-28 ${isDarkMode ? 'text-zinc-400' : 'text-muted-foreground'}`}>
                        {input.label}
                      </span>
                      <input
                        type="text"
                        value={customInputs[i] || ""}
                        onChange={(e) => handleCustomInputChange(i, e.target.value)}
                        placeholder={`Enter ${input.label.replace(":", "")}`}
                        className={`flex-1 bg-transparent border-b text-sm py-1 outline-none ${
                          isDarkMode 
                            ? 'border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400' 
                            : 'border-muted text-foreground placeholder:text-muted-foreground focus:border-primary'
                        }`}
                      />
                    </div>
                  ))}


                  <p className={`text-xs mt-3 ${isDarkMode ? 'text-zinc-500' : 'text-muted-foreground'}`}>
                    Press Enter after each input value
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
