//C:\Users\nazeer\Desktop\Compailor-version-2\code-compiler-studio\src\components\compiler\ThemeSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/uis/select";
import { Sun, Moon, Monitor, Palette } from "lucide-react";

export type EditorTheme = "light" | "vs-dark" | "vscode-dark" | "gray";

interface ThemeSelectorProps {
  value: EditorTheme;
  onChange: (theme: EditorTheme) => void;
}

const themes: { value: EditorTheme; label: string; preview: string; icon: typeof Sun; isDark: boolean }[] = [
  { value: "light", label: "Light", preview: "bg-white border-border", icon: Sun, isDark: false },
  { value: "vs-dark", label: "Dark", preview: "bg-zinc-900 border-zinc-700", icon: Moon, isDark: true },
  { value: "vscode-dark", label: "VS Code Dark", preview: "bg-[#1e1e1e] border-zinc-600", icon: Monitor, isDark: true },
  { value: "gray", label: "Gray", preview: "bg-zinc-800 border-zinc-600", icon: Palette, isDark: true },
];

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const currentTheme = themes.find((t) => t.value === value);
  const CurrentIcon = currentTheme?.icon || Sun;

  return (
    <Select value={value} onValueChange={(v) => onChange(v as EditorTheme)}>
      <SelectTrigger className="w-44 h-8 text-sm">
        <CurrentIcon className="w-4 h-4 mr-2" />
        <SelectValue>{currentTheme?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent className=" bg-gray-800 text-cyan-50 hover:bg-gray-800 hover:text-cyan-50">
        {themes.map((theme) => {
          const Icon = theme.icon;
          return (
            <SelectItem key={theme.value} value={theme.value} >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <div className={`w-4 h-4 rounded border ${theme.preview}`} />
                {theme.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// Helper to check if theme is dark
export function isThemeDark(theme: EditorTheme): boolean {
  return themes.find((t) => t.value === theme)?.isDark ?? false;
}
