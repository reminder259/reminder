import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reminder } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PomodoroMode = "work" | "break" | "long-break";

interface PomodoroSettings {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
}

export default function Pomodoro() {
  // Timer state
  const [mode, setMode] = useState<PomodoroMode>("work");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedReminderId, setSelectedReminderId] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState<PomodoroSettings>({
    workMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    sessionsUntilLongBreak: 4
  });

  const { toast } = useToast();
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch incomplete reminders
  const { data: reminders = [] } = useQuery<Reminder[]>({
    queryKey: ['/api/reminders'],
  });

  // Filter for incomplete reminders
  const incompleteReminders = reminders.filter(reminder => !reminder.completed);

  useEffect(() => {
    // Initialize timer based on current mode
    resetTimer();
    
    // Initialize audio
    audioRef.current = new Audio("/notification.mp3");
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mode, settings]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleTimerComplete();
    }
  }, [timeLeft]);

  // Reset timer based on current mode
  const resetTimer = () => {
    let duration = 0;
    switch (mode) {
      case "work":
        duration = settings.workMinutes * 60;
        break;
      case "break":
        duration = settings.breakMinutes * 60;
        break;
      case "long-break":
        duration = settings.longBreakMinutes * 60;
        break;
    }
    setTimeLeft(duration);
    setIsActive(false);
  };

  // Start or pause the timer
  const toggleTimer = () => {
    if (isActive) {
      // Pause timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start timer
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    setIsActive(!isActive);
  };

  // Handle timer completion
  const handleTimerComplete = async () => {
    // Play notification sound
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Failed to play notification sound:", e));
    }
    
    if (mode === "work") {
      // Increment completed sessions
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Log session if a reminder is selected
      if (selectedReminderId) {
        try {
          const session = {
            reminderId: selectedReminderId,
            startTime: new Date(Date.now() - settings.workMinutes * 60 * 1000),
            endTime: new Date(),
            duration: settings.workMinutes * 60,
            type: "work",
            completed: true
          };
          
          await apiRequest("POST", "/api/pomodoro", session);
          toast({
            title: "Session logged",
            description: `Pomodoro session has been saved to your reminder.`
          });
        } catch (error) {
          console.error("Failed to log pomodoro session:", error);
        }
      }
      
      // Determine next break type
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setMode("long-break");
        toast({
          title: "Work session complete!",
          description: "Time for a long break. You've earned it!",
        });
      } else {
        setMode("break");
        toast({
          title: "Work session complete!",
          description: "Time for a short break!",
        });
      }
    } else {
      // Switch back to work mode after a break
      setMode("work");
      toast({
        title: "Break time over",
        description: "Let's get back to work!",
      });
    }
    
    resetTimer();
  };

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    let total;
    switch (mode) {
      case "work":
        total = settings.workMinutes * 60;
        break;
      case "break":
        total = settings.breakMinutes * 60;
        break;
      case "long-break":
        total = settings.longBreakMinutes * 60;
        break;
    }
    return 100 - ((timeLeft / total) * 100);
  };

  // Save settings
  const saveSettings = (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    setSettingsOpen(false);
    resetTimer();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className={cn(
            "transition-all", 
            mode === "work" ? "border-primary" : 
            mode === "break" ? "border-green-500" : "border-blue-500"
          )}>
            <CardHeader className="space-y-1 text-center pb-2">
              <CardTitle className={cn(
                "text-3xl font-bold",
                mode === "work" ? "text-primary" : 
                mode === "break" ? "text-green-500" : "text-blue-500"
              )}>
                {mode === "work" ? "Focus Time" : 
                 mode === "break" ? "Short Break" : "Long Break"}
              </CardTitle>
              <CardDescription>
                Session {Math.floor(completedSessions / settings.sessionsUntilLongBreak) + 1} • 
                {completedSessions % settings.sessionsUntilLongBreak} / {settings.sessionsUntilLongBreak} pomodoros
              </CardDescription>
              
              <div className="flex justify-center mt-2">
                <Tabs defaultValue={mode} onValueChange={(value) => setMode(value as PomodoroMode)}>
                  <TabsList>
                    <TabsTrigger value="work">Work</TabsTrigger>
                    <TabsTrigger value="break">Short Break</TabsTrigger>
                    <TabsTrigger value="long-break">Long Break</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4 pb-8 flex flex-col items-center">
              <div className="text-6xl font-mono font-bold py-8">
                {formatTime(timeLeft)}
              </div>
              
              <Progress 
                value={calculateProgress()} 
                className="w-full h-3 mb-6"
                style={{
                  '--progress-background': mode === "work" ? 'hsl(var(--primary))' : 
                                          mode === "break" ? '#4caf50' : '#2196f3'
                } as React.CSSProperties}
              />
              
              <div className="flex space-x-4 mt-2">
                <Button
                  size="lg"
                  onClick={toggleTimer}
                  className={cn(
                    "px-8 transition-all",
                    mode === "work" ? "bg-primary hover:bg-primary/90" : 
                    mode === "break" ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  {isActive ? (
                    <><Pause className="mr-2 h-5 w-5" /> Pause</>
                  ) : (
                    <><Play className="mr-2 h-5 w-5" /> Start</>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={resetTimer}
                  disabled={isActive}
                >
                  <RotateCcw className="mr-2 h-5 w-5" /> Reset
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{completedSessions}</div>
                  <div className="text-sm text-muted-foreground">Completed Sessions</div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{Math.round(completedSessions * settings.workMinutes / 60)}</div>
                  <div className="text-sm text-muted-foreground">Hours Focused</div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{Math.floor(completedSessions / settings.sessionsUntilLongBreak)}</div>
                  <div className="text-sm text-muted-foreground">Completed Cycles</div>
                </div>
                
                <div className="bg-muted p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{selectedReminderId ? 1 : 0}</div>
                  <div className="text-sm text-muted-foreground">Tasks In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Current Task</CardTitle>
              <CardDescription>
                Select a reminder to focus on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {incompleteReminders.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Coffee className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No incomplete reminders found.</p>
                  <p className="text-sm mt-1">Create a reminder to start tracking your focus time.</p>
                </div>
              ) : (
                <>
                  <Select value={selectedReminderId?.toString()} onValueChange={(value) => setSelectedReminderId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reminder" />
                    </SelectTrigger>
                    <SelectContent>
                      {incompleteReminders.map((reminder) => (
                        <SelectItem key={reminder.id} value={reminder.id.toString()}>
                          {reminder.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedReminderId && (
                    <div className="border rounded-md p-4 mt-4">
                      {incompleteReminders.filter(r => r.id === selectedReminderId).map((reminder) => (
                        <div key={reminder.id} className="space-y-2">
                          <div className="font-medium">{reminder.title}</div>
                          {reminder.description && (
                            <div className="text-sm text-muted-foreground">{reminder.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              <div className="border-t pt-4 mt-6">
                <h3 className="font-medium mb-3">Pomodoro Technique</h3>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
                  <li>Select a task to focus on</li>
                  <li>Set the timer (default 25 min)</li>
                  <li>Work on the task until the timer rings</li>
                  <li>Take a short break (5 min)</li>
                  <li>Every 4 pomodoros, take a longer break (15 min)</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pomodoro Settings</DialogTitle>
            <DialogDescription>
              Customize your pomodoro timer durations
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workMinutes" className="text-right">
                Work
              </Label>
              <Input
                id="workMinutes"
                type="number"
                className="col-span-3"
                value={settings.workMinutes}
                onChange={(e) => setSettings({...settings, workMinutes: parseInt(e.target.value) || 25})}
                min={1}
                max={60}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="breakMinutes" className="text-right">
                Break
              </Label>
              <Input
                id="breakMinutes"
                type="number"
                className="col-span-3"
                value={settings.breakMinutes}
                onChange={(e) => setSettings({...settings, breakMinutes: parseInt(e.target.value) || 5})}
                min={1}
                max={30}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="longBreakMinutes" className="text-right">
                Long Break
              </Label>
              <Input
                id="longBreakMinutes"
                type="number"
                className="col-span-3"
                value={settings.longBreakMinutes}
                onChange={(e) => setSettings({...settings, longBreakMinutes: parseInt(e.target.value) || 15})}
                min={1}
                max={60}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sessionsUntilLongBreak" className="text-right">
                Sessions
              </Label>
              <Input
                id="sessionsUntilLongBreak"
                type="number"
                className="col-span-3"
                value={settings.sessionsUntilLongBreak}
                onChange={(e) => setSettings({...settings, sessionsUntilLongBreak: parseInt(e.target.value) || 4})}
                min={1}
                max={10}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" onClick={() => saveSettings(settings)}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}