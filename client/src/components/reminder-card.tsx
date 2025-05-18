import { useState } from "react";
import { format } from "date-fns";
import { Edit, Trash2, Volume2, Clock, Check, Bell, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Reminder } from "@shared/schema";
import { useCategories, getDefaultCategoryById } from "@/lib/categories";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReminderModal } from "./reminder-modal";

interface ReminderCardProps {
  reminder: Reminder;
  view?: "compact" | "full";
}

export function ReminderCard({ reminder, view = "full" }: ReminderCardProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null)[0] || new Audio();
  const { toast } = useToast();
  
  // Get category information
  const defaultCategory = getDefaultCategoryById(reminder.category);
  const categoryStyle = defaultCategory ? {
    bgColor: defaultCategory.bgColor,
    textColor: defaultCategory.textColor,
    color: defaultCategory.color,
    emoji: defaultCategory.emoji,
    name: defaultCategory.name
  } : {
    bgColor: "bg-gray-500",
    textColor: "text-white",
    color: "#9e9e9e",
    emoji: "📝",
    name: "Uncategorized"
  };
  
  // Format date & time
  const reminderDate = new Date(reminder.dateTime);
  const formattedDate = format(reminderDate, "PPP");
  const formattedTime = format(reminderDate, "h:mm a");
  
  // Check if the reminder is due soon or overdue 
  const now = new Date();
  const isOverdue = reminderDate < now && !reminder.completed;
  const isDueSoon = !isOverdue && 
    reminderDate.getTime() - now.getTime() < 3600000 && // Due within the next hour
    !reminder.completed;
  
  // Get recurrence text
  const recurrenceMap = {
    "one-time": "One-time",
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "custom": "Custom"
  };
  
  // Priority display
  const priorityMap = {
    1: { label: "Low", color: "bg-blue-500" },
    2: { label: "Medium", color: "bg-yellow-500" },
    3: { label: "High", color: "bg-red-500" }
  };
  
  const priority = reminder.priority ? (priorityMap[reminder.priority as keyof typeof priorityMap] || priorityMap[1]) : priorityMap[1];
  
  // Handle reminder completion toggle
  const handleToggleCompletion = async () => {
    try {
      await apiRequest("PATCH", `/api/reminders/${reminder.id}/toggle`, {});
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      toast({
        title: reminder.completed ? "Reminder marked as incomplete" : "Reminder completed",
        description: `${reminder.title} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reminder status.",
        variant: "destructive"
      });
    }
  };
  
  // Handle reminder deletion
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        await apiRequest("DELETE", `/api/reminders/${reminder.id}`, {});
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
        toast({
          title: "Reminder deleted",
          description: `${reminder.title} has been removed.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete reminder.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Handle voice note playback
  const handlePlayVoiceNote = () => {
    if (reminder.voiceNote) {
      if (audioPlaying) {
        audioRef.pause();
        setAudioPlaying(false);
      } else {
        audioRef.src = reminder.voiceNote;
        audioRef.onended = () => setAudioPlaying(false);
        audioRef.play();
        setAudioPlaying(true);
      }
    }
  };
  
  // Handle reminder snooze
  const handleSnooze = async (minutes: number) => {
    try {
      await apiRequest("PATCH", `/api/reminders/${reminder.id}/snooze`, { minutes });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      toast({
        title: "Reminder snoozed",
        description: `${reminder.title} snoozed for ${minutes} minutes.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to snooze reminder.",
        variant: "destructive"
      });
    }
  };
  
  if (view === "compact") {
    return (
      <div className={cn(
        "text-xs p-1.5 rounded truncate flex items-center",
        categoryStyle.bgColor,
        categoryStyle.textColor
      )}>
        {reminder.completed && <Check className="h-3 w-3 mr-1" />}
        {!reminder.completed && isDueSoon && <Clock className="h-3 w-3 mr-1 animate-pulse" />}
        {!reminder.completed && isOverdue && <Bell className="h-3 w-3 mr-1 animate-ping" />}
        {reminder.title} ({formattedTime})
      </div>
    );
  }
  
  return (
    <>
      <div className={cn(
        "p-4", 
        isOverdue && "bg-red-50 dark:bg-red-900/10",
        isDueSoon && "bg-yellow-50 dark:bg-yellow-900/10"
      )}>
        <div className="flex items-center">
          <Checkbox 
            checked={reminder.completed} 
            onCheckedChange={handleToggleCompletion}
            className={cn(
              "rounded mr-4", 
              reminder.completed ? "text-green-500" : "text-primary"
            )}
          />
          
          <div className={cn(
            "flex-1 ml-2 border-l-4 pl-3 py-2 rounded bg-muted/50",
            `border-[${categoryStyle.color}]`,
            reminder.completed && "opacity-60"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center mb-1">
                  <h4 className={cn("font-medium text-base", reminder.completed && "line-through")}>
                    {reminder.title}
                  </h4>
                  
                  {/* Priority indicator */}
                  {reminder.priority && reminder.priority > 1 && (
                    <div 
                      className={cn(
                        "h-2 w-2 rounded-full ml-2", 
                        priority.color
                      )}
                      title={`${priority.label} Priority`}
                    ></div>
                  )}
                </div>
                
                {reminder.description && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    {reminder.description}
                  </p>
                )}
                
                {/* Optional notes */}
                {reminder.notes && (
                  <div className="text-xs mt-2 border-l-2 pl-2 border-muted-foreground/30 italic text-muted-foreground">
                    {reminder.notes}
                  </div>
                )}
                
                <div className="flex flex-wrap items-center mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center mr-3">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {formattedDate}, {formattedTime}
                  </div>
                  
                  <div className="flex items-center mr-3">
                    <ArrowRight className="h-3.5 w-3.5 mr-1" />
                    {recurrenceMap[reminder.recurrence as keyof typeof recurrenceMap]}
                  </div>
                  
                  {reminder.tags && reminder.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {reminder.tags.map((tag, index) => (
                        <span key={index} className="bg-muted px-1.5 py-0.5 rounded-sm text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col space-y-1.5 items-end">
                <Badge className={categoryStyle.bgColor + " " + categoryStyle.textColor + " flex items-center"}>
                  {categoryStyle.emoji && (
                    <span className="mr-1">{categoryStyle.emoji}</span>
                  )}
                  <span>{categoryStyle.name}</span>
                </Badge>
                
                {reminder.voiceNote && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-6 w-6 p-0" 
                    onClick={handlePlayVoiceNote}
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Display subtasks if available */}
            {false && ( // Placeholder for future subtasks implementation
              <div className="mt-3 pl-2 border-t pt-2 border-dashed">
                <p className="text-xs font-medium mb-1">Subtasks</p>
                <ul className="space-y-1">
                  <li className="flex items-center text-xs">
                    <Checkbox className="h-3 w-3 mr-1" />
                    <span>Subtask 1</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex flex-col space-y-2 ml-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Snooze options for overdue or due soon reminders */}
        {(isOverdue || isDueSoon) && !reminder.completed && (
          <div className="mt-2 flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleSnooze(15)}>
              Snooze 15m
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSnooze(60)}>
              Snooze 1h
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSnooze(1440)}>
              Snooze 1d
            </Button>
          </div>
        )}
      </div>
      
      <ReminderModal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        reminder={reminder}
      />
    </>
  );
}
