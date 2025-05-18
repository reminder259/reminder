import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ReminderCard } from "@/components/reminder-card";
import { Search, Calendar, Clock, Plus, RefreshCw, Filter, CalendarRange } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ReminderCategory } from "@shared/schema";
import { DateFilter } from "./date-filter";
import { format, isToday, isTomorrow, isThisWeek, isThisMonth, isBefore } from "date-fns";
import { ReminderModal } from "./reminder-modal";
import { useCategories } from "@/lib/categories";

interface RemindersListProps {
  title?: string;
  filterCategory?: ReminderCategory;
  maxItems?: number;
  showSearch?: boolean;
  showTimeFilter?: boolean;
  showHeader?: boolean;
  showAddButton?: boolean;
}

export function RemindersList({
  title = "All Reminders",
  filterCategory,
  maxItems,
  showSearch = true,
  showTimeFilter = true,
  showHeader = true,
  showAddButton = true
}: RemindersListProps) {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(filterCategory || "all");
  const [timeFrame, setTimeFrame] = useState<"all" | "today" | "tomorrow" | "thisWeek" | "thisMonth" | "custom" | "overdue">("all");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Use categories from the custom hook
  const { categories = [], isLoading: loadingCategories } = useCategories();
  
  // Fetch reminders with auto-refresh
  const { 
    data: reminders = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['/api/reminders'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Manual refresh function
  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  // Update filters when filterCategory prop changes
  useEffect(() => {
    if (filterCategory) {
      setCategoryFilter(filterCategory);
    }
  }, [filterCategory]);

  // Apply filters
  const filteredReminders = reminders.filter((reminder: any) => {
    // Filter by search text
    const matchesSearch = searchText === "" || 
      reminder.title?.toLowerCase().includes(searchText.toLowerCase()) || 
      (reminder.description && reminder.description.toLowerCase().includes(searchText.toLowerCase())) ||
      (reminder.notes && reminder.notes.toLowerCase().includes(searchText.toLowerCase())) ||
      (reminder.tags && reminder.tags.some((tag: string) => tag.toLowerCase().includes(searchText.toLowerCase())));
    
    // Filter by category
    const matchesCategory = categoryFilter === "all" || reminder.category === categoryFilter;
    
    // Filter by time frame
    let matchesTimeFrame = true;
    const reminderDate = new Date(reminder.dateTime);
    const now = new Date();
    
    switch (timeFrame) {
      case "today":
        matchesTimeFrame = isToday(reminderDate);
        break;
      case "tomorrow":
        matchesTimeFrame = isTomorrow(reminderDate);
        break;
      case "thisWeek":
        matchesTimeFrame = isThisWeek(reminderDate);
        break;
      case "thisMonth":
        matchesTimeFrame = isThisMonth(reminderDate);
        break;
      case "overdue":
        matchesTimeFrame = isBefore(reminderDate, now) && !reminder.completed;
        break;
      case "custom":
        if (customDate) {
          const customDateStart = new Date(customDate);
          customDateStart.setHours(0, 0, 0, 0);
          const customDateEnd = new Date(customDate);
          customDateEnd.setHours(23, 59, 59, 999);
          matchesTimeFrame = reminderDate >= customDateStart && reminderDate <= customDateEnd;
        }
        break;
      default:
        // "all" case - no filtering by time
        matchesTimeFrame = true;
    }
    
    return matchesSearch && matchesCategory && matchesTimeFrame;
  });

  // Sort reminders: incomplete first, then by date
  const sortedReminders = [...filteredReminders].sort((a: any, b: any) => {
    // Sort by completion status first
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then sort by date
    return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  });

  // Limit the number of items if maxItems is provided
  const displayedReminders = maxItems ? sortedReminders.slice(0, maxItems) : sortedReminders;

  // Format refresh time
  const formattedRefreshTime = lastRefresh.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Handle date filter change
  const handleDateFilterChange = (range: { timeFrame: any; startDate?: Date; endDate?: Date }) => {
    setTimeFrame(range.timeFrame);
    if (range.timeFrame === "custom" && range.startDate) {
      setCustomDate(range.startDate);
    }
  };

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="p-4 border-b flex justify-between items-center">
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
            {showSearch && (
              <div className="flex items-center space-x-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>
            )}
          </CardHeader>
        )}
        <CardContent className="p-0 divide-y">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex">
                <Skeleton className="h-4 w-4 mr-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Count active filters
  const activeFilterCount = (
    (searchText ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (timeFrame !== "all" ? 1 : 0)
  );

  return (
    <Card>
      {showHeader && (
        <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="flex items-center mt-1 text-xs">
              Updated at {formattedRefreshTime}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={handleRefresh}>
                <RefreshCw className="h-3 w-3" />
              </Button>
            </CardDescription>
          </div>
          
          {showAddButton && (
            <Button size="sm" onClick={() => setModalOpen(true)} className="mt-3 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          )}
        </CardHeader>
      )}
      
      {(showSearch || showTimeFilter) && (
        <div className="p-4 border-b space-y-3">
          {showSearch && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search title, description, notes or tags..."
                className="pl-10"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              {searchText && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 w-6 p-0"
                  onClick={() => setSearchText("")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </Button>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {showTimeFilter && (
              <DateFilter onFilterChange={handleDateFilterChange} />
            )}
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {!loadingCategories && categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center">
                      {category.emoji && <span className="mr-2">{category.emoji}</span>}
                      {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Show active filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {searchText && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchText}
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setSearchText("")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </Badge>
              )}
              
              {categoryFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Category: {categories.find(c => c.id === categoryFilter)?.name || categoryFilter}
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setCategoryFilter("all")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </Badge>
              )}
              
              {timeFrame !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Time: {timeFrame === "thisWeek" ? "This Week" : 
                         timeFrame === "thisMonth" ? "This Month" :
                         timeFrame === "custom" ? format(customDate!, "MMM d, yyyy") :
                         timeFrame}
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setTimeFrame("all")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </Badge>
              )}
              
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                setSearchText("");
                setCategoryFilter("all");
                setTimeFrame("all");
              }}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}
      
      <CardContent className="p-0 divide-y">
        {displayedReminders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {activeFilterCount > 0 ? (
              <>
                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No matching reminders found.</p>
                <p className="text-sm mt-1">Try adjusting your filters or create a new reminder.</p>
              </>
            ) : (
              <>
                <CalendarRange className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No reminders found.</p>
                <p className="text-sm mt-1">Create a new reminder to get started.</p>
              </>
            )}
            
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </div>
        ) : (
          displayedReminders.map((reminder: any) => (
            <ReminderCard key={reminder.id} reminder={reminder} />
          ))
        )}
      </CardContent>
      
      <ReminderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Card>
  );
}
