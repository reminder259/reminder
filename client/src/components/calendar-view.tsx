import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReminderCard } from "@/components/reminder-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarViewMode = "month" | "week" | "day";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['/api/reminders'],
  });

  const today = new Date();
  
  // Calendar navigation
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  
  // Get days for current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Add empty cells for days before the first day of month
  const startDay = getDay(monthStart);
  const blanks = Array(startDay).fill(null);
  
  // Get reminders for specific day
  const getRemindersForDay = (date: Date) => {
    if (!reminders) return [];
    
    return reminders.filter((reminder: any) => {
      const reminderDate = new Date(reminder.dateTime);
      return (
        reminderDate.getDate() === date.getDate() &&
        reminderDate.getMonth() === date.getMonth() &&
        reminderDate.getFullYear() === date.getFullYear()
      );
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="p-4 border-b flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center p-4">
            {dayNames.map(day => (
              <div key={day} className="font-medium">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 p-4">
            {Array(35).fill(null).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-xl font-heading font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="ml-4 flex">
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-l-md rounded-r-none"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="secondary"
              size="icon"
              className="rounded-l-none rounded-r-md"
              onClick={nextMonth}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex">
          <Button 
            variant={viewMode === "month" ? "default" : "secondary"}
            className="rounded-l-md rounded-r-none"
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
          <Button 
            variant={viewMode === "week" ? "default" : "secondary"}
            className="rounded-none"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button 
            variant={viewMode === "day" ? "default" : "secondary"}
            className="rounded-l-none rounded-r-md"
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-2 mb-2 text-center font-medium">
          {dayNames.map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {/* Blank spaces before first day of month */}
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="calendar-day border rounded-md p-2 h-28 overflow-y-auto opacity-50"></div>
          ))}
          
          {/* Days of the month */}
          {daysInMonth.map(day => {
            const dayReminders = getRemindersForDay(day);
            const hasReminders = dayReminders.length > 0;
            
            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "calendar-day border rounded-md p-2 h-28 overflow-y-auto",
                  hasReminders && "has-reminder",
                  isToday(day) && "bg-primary/10 border-primary",
                  !isSameMonth(day, currentDate) && "opacity-50"
                )}
              >
                <div className={cn(
                  "text-sm mb-1", 
                  isToday(day) && "font-bold text-primary"
                )}>
                  {format(day, 'd')}
                </div>
                
                {/* Display reminders for this day */}
                {dayReminders.slice(0, 3).map((reminder: any) => (
                  <ReminderCard 
                    key={reminder.id} 
                    reminder={reminder} 
                    view="compact"
                  />
                ))}
                
                {/* Show indicator for more reminders */}
                {dayReminders.length > 3 && (
                  <div className="text-xs mt-1 text-muted-foreground">
                    +{dayReminders.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
