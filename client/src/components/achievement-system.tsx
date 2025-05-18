import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Award, Calendar, CheckCircle, Target, TrendingUp, Medal, Flame } from "lucide-react";

interface AchievementProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  category: string;
}

export function AchievementSystem() {
  const { toast } = useToast();
  
  // Fetch reminders to calculate achievements
  const { data: reminders = [], isLoading: loadingReminders } = useQuery<any[]>({
    queryKey: ['/api/reminders'],
  });
  
  // Current streak state
  const [streak, setStreak] = useState({
    current: 0,
    best: 0,
    lastCompleted: null as Date | null
  });
  
  // Achievements state
  const [achievements, setAchievements] = useState<AchievementProps[]>([
    {
      id: "first-reminder",
      name: "Getting Started",
      description: "Create your first reminder",
      icon: <CheckCircle className="h-8 w-8 text-blue-500" />,
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      category: "beginner"
    },
    {
      id: "five-completed",
      name: "Productivity Master",
      description: "Complete 5 reminders",
      icon: <Award className="h-8 w-8 text-purple-500" />,
      progress: 0,
      maxProgress: 5,
      unlocked: false,
      category: "completion"
    },
    {
      id: "daily-streak-3",
      name: "Consistency",
      description: "Complete at least one reminder for 3 days in a row",
      icon: <Flame className="h-8 w-8 text-orange-500" />,
      progress: 0,
      maxProgress: 3,
      unlocked: false,
      category: "streak"
    },
    {
      id: "all-categories",
      name: "Well Rounded",
      description: "Create reminders in all available categories",
      icon: <Target className="h-8 w-8 text-green-500" />,
      progress: 0,
      maxProgress: 4,
      unlocked: false,
      category: "exploration"
    },
    {
      id: "thirty-minutes-focus",
      name: "Deep Focus",
      description: "Complete 30 minutes of focused work using the Pomodoro timer",
      icon: <TrendingUp className="h-8 w-8 text-cyan-500" />,
      progress: 0,
      maxProgress: 30,
      unlocked: false,
      category: "focus"
    }
  ]);
  
  // Calculate current streak and achievements based on reminder data
  useEffect(() => {
    if (reminders.length === 0) return;
    
    // Update achievements
    const updatedAchievements = [...achievements];
    
    // First reminder achievement
    if (reminders.length > 0) {
      const firstReminderAchievement = updatedAchievements.find(a => a.id === "first-reminder");
      if (firstReminderAchievement && !firstReminderAchievement.unlocked) {
        firstReminderAchievement.progress = 1;
        firstReminderAchievement.unlocked = true;
        
        toast({
          title: "Achievement Unlocked!",
          description: `${firstReminderAchievement.name}: ${firstReminderAchievement.description}`,
        });
      }
    }
    
    // Completed reminders achievement
    const completedReminders = reminders.filter(r => r.completed).length;
    const fiveCompletedAchievement = updatedAchievements.find(a => a.id === "five-completed");
    if (fiveCompletedAchievement) {
      const wasUnlocked = fiveCompletedAchievement.unlocked;
      fiveCompletedAchievement.progress = Math.min(completedReminders, 5);
      fiveCompletedAchievement.unlocked = completedReminders >= 5;
      
      if (!wasUnlocked && fiveCompletedAchievement.unlocked) {
        toast({
          title: "Achievement Unlocked!",
          description: `${fiveCompletedAchievement.name}: ${fiveCompletedAchievement.description}`,
        });
      }
    }
    
    // Calculate category coverage
    const usedCategories = new Set(reminders.map(r => r.category));
    const allCategoriesAchievement = updatedAchievements.find(a => a.id === "all-categories");
    if (allCategoriesAchievement) {
      const wasUnlocked = allCategoriesAchievement.unlocked;
      allCategoriesAchievement.progress = usedCategories.size;
      allCategoriesAchievement.unlocked = usedCategories.size >= 4;
      
      if (!wasUnlocked && allCategoriesAchievement.unlocked) {
        toast({
          title: "Achievement Unlocked!",
          description: `${allCategoriesAchievement.name}: ${allCategoriesAchievement.description}`,
        });
      }
    }
    
    // Update achievements state
    setAchievements(updatedAchievements);
    
    // Calculate daily streak
    const completedByDate = new Map<string, boolean>();
    
    // Group completed reminders by date
    reminders.filter(r => r.completed).forEach(r => {
      const date = new Date(r.completedDate || r.dateTime);
      const dateStr = date.toISOString().split('T')[0];
      completedByDate.set(dateStr, true);
    });
    
    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // Check today first
    const todayStr = checkDate.toISOString().split('T')[0];
    if (completedByDate.has(todayStr)) {
      currentStreak = 1;
      
      // Check previous days
      checkDate.setDate(checkDate.getDate() - 1);
      while (completedByDate.has(checkDate.toISOString().split('T')[0])) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      // Check if yesterday has completions
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      
      if (completedByDate.has(yesterdayStr)) {
        // Streak is still alive if there's a completion yesterday
        currentStreak = 1;
        
        // Check previous days
        checkDate.setDate(checkDate.getDate() - 1);
        while (completedByDate.has(checkDate.toISOString().split('T')[0])) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }
    
    // Update streak achievement
    const streakAchievement = updatedAchievements.find(a => a.id === "daily-streak-3");
    if (streakAchievement) {
      const wasUnlocked = streakAchievement.unlocked;
      streakAchievement.progress = Math.min(currentStreak, 3);
      streakAchievement.unlocked = currentStreak >= 3;
      
      if (!wasUnlocked && streakAchievement.unlocked) {
        toast({
          title: "Achievement Unlocked!",
          description: `${streakAchievement.name}: ${streakAchievement.description}`,
        });
      }
    }
    
    // Update streak state
    setStreak(prev => ({
      current: currentStreak,
      best: Math.max(prev.best, currentStreak),
      lastCompleted: completedByDate.has(todayStr) ? today : null
    }));
    
  }, [reminders, toast]);
  
  // Group achievements by category
  const achievementsByCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, AchievementProps[]>);
  
  const categoryNames = {
    beginner: "Getting Started",
    completion: "Task Completion",
    streak: "Consistency",
    exploration: "Exploration",
    focus: "Focus & Productivity"
  };
  
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <Flame className="h-10 w-10" />
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold">Current Streak: {streak.current} {streak.current > 0 ? "day" + (streak.current > 1 ? "s" : "") : "days"}</h2>
                <p className="text-sm opacity-90">Best streak: {streak.best} days</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Badge variant="secondary" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-none px-3 py-1">
                <Medal className="h-4 w-4 mr-1" />
                <span>{achievements.filter(a => a.unlocked).length}/{achievements.length} Badges</span>
              </Badge>
              
              <Badge variant="secondary" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-none px-3 py-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Daily Check-in</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{categoryNames[category as keyof typeof categoryNames] || category}</CardTitle>
            <CardDescription>
              {category === "streak" && "Build habits by completing reminders consistently"}
              {category === "beginner" && "Complete these first achievements to get started"}
              {category === "completion" && "Make progress by completing your reminders"}
              {category === "exploration" && "Try out different features of the app"}
              {category === "focus" && "Improve your productivity with focus sessions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryAchievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`border rounded-md p-4 flex items-center ${achievement.unlocked ? "bg-muted/30" : ""}`}
                >
                  <div className={`mr-4 rounded-full p-2 ${achievement.unlocked ? "bg-primary/10" : "bg-muted"}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{achievement.name}</h4>
                      {achievement.unlocked && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <Progress value={(achievement.progress / achievement.maxProgress) * 100} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}