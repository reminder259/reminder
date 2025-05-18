import { useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ColorScheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const colorSchemes: ColorScheme[] = [
  {
    id: "blue",
    name: "Blue Sky",
    primaryColor: "#3b82f6", // blue-500
    secondaryColor: "#60a5fa", // blue-400
    accentColor: "#2563eb", // blue-600
  },
  {
    id: "purple",
    name: "Royal Purple",
    primaryColor: "#8b5cf6", // violet-500
    secondaryColor: "#a78bfa", // violet-400
    accentColor: "#7c3aed", // violet-600
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    primaryColor: "#10b981", // emerald-500
    secondaryColor: "#34d399", // emerald-400
    accentColor: "#059669", // emerald-600
  },
  {
    id: "rose",
    name: "Rose Garden",
    primaryColor: "#f43f5e", // rose-500
    secondaryColor: "#fb7185", // rose-400
    accentColor: "#e11d48", // rose-600
  },
  {
    id: "amber",
    name: "Golden Sunset",
    primaryColor: "#f59e0b", // amber-500
    secondaryColor: "#fbbf24", // amber-400
    accentColor: "#d97706", // amber-600
  },
  {
    id: "slate",
    name: "Midnight Slate",
    primaryColor: "#64748b", // slate-500
    secondaryColor: "#94a3b8", // slate-400
    accentColor: "#475569", // slate-600
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [colorScheme, setColorScheme] = useState<string>("blue");
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleColorSchemeChange = (newScheme: string) => {
    setColorScheme(newScheme);
    
    // Apply the color scheme by updating CSS variables
    const scheme = colorSchemes.find(s => s.id === newScheme);
    if (scheme) {
      document.documentElement.style.setProperty('--primary', scheme.primaryColor);
      document.documentElement.style.setProperty('--secondary', scheme.secondaryColor);
      document.documentElement.style.setProperty('--accent', scheme.accentColor);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how ReminderPro looks for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <div 
                className={cn(
                  "flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer hover:bg-accent/50",
                  theme === "light" ? "border-primary" : "border-transparent"
                )}
                onClick={() => handleThemeChange("light")}
              >
                <div className="h-24 w-24 rounded-md bg-[#f8fafc] border mb-2 flex items-center justify-center">
                  {theme === "light" && <Check className="h-8 w-8 text-primary" />}
                </div>
                <span className="text-sm font-medium">Light</span>
              </div>
              
              <div 
                className={cn(
                  "flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer hover:bg-accent/50",
                  theme === "dark" ? "border-primary" : "border-transparent"
                )}
                onClick={() => handleThemeChange("dark")}
              >
                <div className="h-24 w-24 rounded-md bg-[#1e293b] border mb-2 flex items-center justify-center">
                  {theme === "dark" && <Check className="h-8 w-8 text-primary" />}
                </div>
                <span className="text-sm font-medium">Dark</span>
              </div>
              
              <div 
                className={cn(
                  "flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer hover:bg-accent/50",
                  theme === "system" ? "border-primary" : "border-transparent"
                )}
                onClick={() => handleThemeChange("system")}
              >
                <div className="h-24 w-24 rounded-md bg-gradient-to-br from-[#f8fafc] to-[#1e293b] border mb-2 flex items-center justify-center">
                  {theme === "system" && <Check className="h-8 w-8 text-primary" />}
                </div>
                <span className="text-sm font-medium">System</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Color Scheme</Label>
              <Badge variant="outline" className="text-xs">
                Customizable
              </Badge>
            </div>
            
            <RadioGroup
              defaultValue={colorScheme}
              onValueChange={handleColorSchemeChange}
              className="grid grid-cols-2 md:grid-cols-3 gap-2"
            >
              {colorSchemes.map((scheme) => (
                <div key={scheme.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={scheme.id} id={`color-${scheme.id}`} className="sr-only" />
                  <Label
                    htmlFor={`color-${scheme.id}`}
                    className={cn(
                      "flex flex-1 items-center justify-between rounded-md border-2 border-muted p-3 cursor-pointer hover:border-accent",
                      colorScheme === scheme.id && "border-primary"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="h-4 w-4 rounded-full" 
                        style={{ backgroundColor: scheme.primaryColor }}
                      />
                      <span>{scheme.name}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}