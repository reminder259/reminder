import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronsUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";

type TimeFrame = "all" | "today" | "tomorrow" | "thisWeek" | "thisMonth" | "custom";

interface DateFilterProps {
  onFilterChange: (range: { timeFrame: TimeFrame; startDate?: Date; endDate?: Date }) => void;
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("all");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleTimeFrameSelect = (frame: TimeFrame) => {
    setTimeFrame(frame);
    
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    switch (frame) {
      case "today":
        startDate = now;
        endDate = now;
        break;
      case "tomorrow":
        startDate = new Date(now);
        startDate.setDate(now.getDate() + 1);
        endDate = startDate;
        break;
      case "thisWeek":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "thisMonth":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "custom":
        startDate = date;
        endDate = date;
        setIsOpen(true);
        break;
      default:
        // "all" case
        startDate = undefined;
        endDate = undefined;
    }
    
    onFilterChange({ timeFrame, startDate, endDate });
    
    if (frame !== "custom") {
      setIsOpen(false);
    }
  };
  
  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    
    if (selectedDate) {
      onFilterChange({ timeFrame: "custom", startDate: selectedDate, endDate: selectedDate });
    }
    
    setIsOpen(false);
  };
  
  // Show the date label based on the timeFrame
  const getDateLabel = () => {
    switch (timeFrame) {
      case "today":
        return "Today";
      case "tomorrow":
        return "Tomorrow";
      case "thisWeek":
        return "This Week";
      case "thisMonth":
        return "This Month";
      case "custom":
        return date ? format(date, "PPP") : "Select a date";
      default:
        return "All Time";
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-between",
              timeFrame !== "all" && "border-primary"
            )}
          >
            <span className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              {getDateLabel()}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="grid grid-cols-2 gap-1">
              <Button
                variant="ghost"
                className={cn(timeFrame === "all" && "bg-muted")}
                onClick={() => handleTimeFrameSelect("all")}
              >
                All Time
              </Button>
              <Button
                variant="ghost"
                className={cn(timeFrame === "today" && "bg-muted")}
                onClick={() => handleTimeFrameSelect("today")}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                className={cn(timeFrame === "tomorrow" && "bg-muted")}
                onClick={() => handleTimeFrameSelect("tomorrow")}
              >
                Tomorrow
              </Button>
              <Button
                variant="ghost"
                className={cn(timeFrame === "thisWeek" && "bg-muted")}
                onClick={() => handleTimeFrameSelect("thisWeek")}
              >
                This Week
              </Button>
              <Button
                variant="ghost"
                className={cn(timeFrame === "thisMonth" && "bg-muted")}
                onClick={() => handleTimeFrameSelect("thisMonth")}
              >
                This Month
              </Button>
              <Button
                variant="ghost"
                className={cn(timeFrame === "custom" && "bg-muted")}
                onClick={() => handleTimeFrameSelect("custom")}
              >
                Custom Date
              </Button>
            </div>
          </div>
          
          {(timeFrame === "custom" || isOpen) && (
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              modifiers={{
                today: [new Date()],
              }}
              modifiersStyles={{
                today: {
                  fontWeight: "bold",
                  color: "var(--color-primary)",
                  borderColor: "var(--color-primary)",
                },
              }}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}