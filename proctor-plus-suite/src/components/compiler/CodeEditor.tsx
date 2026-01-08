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
  onRunAll?: (code: string, language: string,) => void;
  onSubmit?: (code: string, language: string) => void;
  isRunning?: boolean;
  output?: string;
  editorTheme?: EditorTheme;
  testCaseStatuses?: { index: number; status: "passed" | "failed" }[];
  code: string;
  onCodeChange: (code: string) => void;
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
  code: externalCode, 
  onRun,
  onRunAll, 
  onSubmit,
  onCodeChange, 
  isRunning = false,
  output: initialOutput = "",
  editorTheme = "vs-dark"
}: CodeEditorProps) {

  const [selectedLanguage, setSelectedLanguage] = useState(() => languages?.[0] ?? "Python");

  // const [code, setCode] = useState(defaultCode[languageMap[selectedLanguage]] || "");
  const [code, setCode] = useState("");

  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState(initialOutput);

  const [outputTab, setOutputTab] = useState<"output" | "custom">("output");
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});

  


    
  
 
  const [inputRequired, setInputRequired] = useState(false);

  useEffect(() => {
    const needsInput = /input\(|fs\.readFileSync|Scanner|readline/.test(code);
    setInputRequired(needsInput);

    

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

    
  }, [code]);

  useEffect(() => {
    setOutput(initialOutput);
  }, [initialOutput]);
  
  useEffect(() => {
    setCode(externalCode || defaultCode[languageMap[selectedLanguage]] || "");
  }, [externalCode, selectedLanguage]);


  


  
  
  const isDarkMode = editorTheme !== "light";
  const defaultLang = languages?.[0] || "Python";


  useEffect(() => {
    if (languages && languages.length > 0) {
      setSelectedLanguage(languages[0]);
      setCode(defaultCode[languageMap[languages[0]]] || "");
    }
  }, [languages]);

  


  

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
    if (window.confirm("Clear your code?")) {
      setCode(defaultCode[languageMap[selectedLanguage]] || "");
      onCodeChange("");
    }

  };

 

  const handleRunClick = () => {
    if (isRunning) {
      toast({
        title: "Execution Stopped",
        description: "Program stopped manually by user.",
      });
      setOutput(prev => prev + "\n\n[Execution manually stopped]");
      // setIsRunning(false);
      return;
    }

    // if (inputRequired && !output.trim()) {
    //   toast({
    //     title: "Input Required",
    //     description: "Please provide input in the output console and click Submit Input.",
    //     variant: "destructive",
    //   });
    //   return;
    // }

    if (inputRequired) {
      setOutput("");
      setIsWaitingForInput(true);
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
                  className="h-8 px-4 bg-gray-800 text-cyan-50 hover:bg-gray-800 hover:text-cyan-50"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Run
                    </>
                  )}
                </Button>

                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onRunAll?.(code, selectedLanguage)}
                  disabled={isRunning}
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
                  onChange={(value) => {
                    const v = value || "";
                    setCode(v);
                    onCodeChange(v);
                  }}

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
                  

                </TabsList>
                {/* {outputTab === "custom" && (
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
                )} */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setOutput("")}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>

              </div>
              
              <TabsContent value="output" className="flex-1 m-0 overflow-auto">
                <div className="h-full overflow-auto p-4 font-mono text-sm scrollbar-thin">
                  {/* {output && isWaitingForInput ? (
                    <textarea
                      value={output}
                      onChange={(e) => setOutput(e.target.value)}
                      placeholder="Waiting for input..."
                      className="w-full h-full bg-black text-green-400 font-mono text-sm p-3 rounded-md resize-none focus:outline-none"
                    />

                  ) : output ? (<pre className="whitespace-pre-wrap text-foreground font-mono text-sm bg-black text-green-400 p-3 rounded-md">
                                  {output}
                                </pre>) : (
                    <span className="text-muted-foreground">Run your code to see output...</span>
                  )} */}
                  {isWaitingForInput ? (
                    <div className="flex flex-col gap-2 h-full">
                      <textarea
                        value={output}
                        onChange={(e) => setOutput(e.target.value)}
                        placeholder="Example:\n5\n6"
                        className="w-full h-full bg-black text-green-400 font-mono text-sm p-3 rounded-md resize-none focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="h-8 px-4"
                          onClick={() => {
                            setIsWaitingForInput(false);
                            onRun?.(code, selectedLanguage, output.trim());
                          }}
                        >
                          Submit Input
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-foreground font-mono text-sm bg-black text-green-400 p-3 rounded-md">
                      {output || "Run your code to see output..."}
                    </pre>
                  )}


                </div>
                {isWaitingForInput && (
                  <div className="px-4 py-2 border-t border-border bg-muted/40 flex justify-end">
                    <Button
                      size="sm"
                      className="h-8 px-4"
                      onClick={() => {
                        setIsWaitingForInput(false);
                        onRun?.(code, selectedLanguage, output.trim());
                      }}
                    >
                      Submit Input
                    </Button>
                  </div>
                )}

              </TabsContent>
              
              
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
