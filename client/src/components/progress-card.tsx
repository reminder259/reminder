import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProgressData {
  label: string;
  completed: number;
  total: number;
  percentage: number;
}

export function ProgressCard() {
  const { data: reminders, isLoading } = useQuery({
    queryKey: ['/api/reminders'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between mb-1 text-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Current date values
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filter reminders
  const todayReminders = reminders.filter((r: any) => {
    const reminderDate = new Date(r.dateTime);
    return reminderDate >= today && reminderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
  });
  
  const weekReminders = reminders.filter((r: any) => {
    const reminderDate = new Date(r.dateTime);
    return reminderDate >= weekStart && reminderDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  });
  
  const monthReminders = reminders.filter((r: any) => {
    const reminderDate = new Date(r.dateTime);
    return reminderDate >= monthStart && reminderDate < new Date(now.getFullYear(), now.getMonth() + 1, 1);
  });

  // Calculate progress
  const progressData: ProgressData[] = [
    {
      label: "Today's tasks",
      completed: todayReminders.filter((r: any) => r.completed).length,
      total: todayReminders.length,
      percentage: todayReminders.length > 0 
        ? Math.round((todayReminders.filter((r: any) => r.completed).length / todayReminders.length) * 100)
        : 0
    },
    {
      label: "This week",
      completed: weekReminders.filter((r: any) => r.completed).length,
      total: weekReminders.length,
      percentage: weekReminders.length > 0
        ? Math.round((weekReminders.filter((r: any) => r.completed).length / weekReminders.length) * 100)
        : 0
    },
    {
      label: "Monthly goal",
      completed: monthReminders.filter((r: any) => r.completed).length,
      total: monthReminders.length,
      percentage: monthReminders.length > 0
        ? Math.round((monthReminders.filter((r: any) => r.completed).length / monthReminders.length) * 100)
        : 0
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progressData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between mb-1 text-sm">
              <span>{item.label}</span>
              <span>
                {item.completed}/{item.total} ({item.percentage}%)
              </span>
            </div>
            <Progress value={item.percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
