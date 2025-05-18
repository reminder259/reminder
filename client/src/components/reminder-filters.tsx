import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Check, ChevronDown, Filter, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/lib/categories";
import { ReminderCategory } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ReminderFiltersProps {
  onFilterChange: (filters: ReminderFilters) => void;
  initialFilters?: ReminderFilters;
}

export interface ReminderFilters {
  search: string;
  timeRange: TimeRange;
  customStartDate?: Date | null;
  customEndDate?: Date | null;
  categories: string[];
  completed: CompletedFilter;
  priority: number[];
}

export type TimeRange = "all" | "today" | "tomorrow" | "this-week" | "this-month" | "overdue" | "custom";
export type CompletedFilter = "all" | "completed" | "incomplete";

export function ReminderFilters({ onFilterChange, initialFilters }: ReminderFiltersProps) {
  // Get categories
  const { categories = [], isLoading: loadingCategories } = useCategories();
  
  // Initialize with default or provided filters
  const [filters, setFilters] = useState<ReminderFilters>(initialFilters || {
    search: "",
    timeRange: "all",
    categories: [],
    completed: "all",
    priority: [1, 2, 3],
  });
  
  // Active filter count (excluding search)
  const activeFilterCount = (
    (filters.timeRange !== "all" ? 1 : 0) +
    (filters.categories.length > 0 ? 1 : 0) +
    (filters.completed !== "all" ? 1 : 0) +
    (filters.priority.length < 3 ? 1 : 0)
  );
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, search: e.target.value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle time range changes
  const handleTimeRangeChange = (value: string) => {
    const newFilters = { ...filters, timeRange: value as TimeRange };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle category selection/deselection
  const handleCategoryChange = (categoryId: string) => {
    let newCategories;
    if (filters.categories.includes(categoryId)) {
      newCategories = filters.categories.filter(id => id !== categoryId);
    } else {
      newCategories = [...filters.categories, categoryId];
    }
    
    const newFilters = { ...filters, categories: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle completion filter changes
  const handleCompletedChange = (value: string) => {
    const newFilters = { ...filters, completed: value as CompletedFilter };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle priority filter changes
  const handlePriorityChange = (value: number) => {
    let newPriorities;
    if (filters.priority.includes(value)) {
      newPriorities = filters.priority.filter(p => p !== value);
    } else {
      newPriorities = [...filters.priority, value];
    }
    
    // Always include at least one priority level
    if (newPriorities.length === 0) {
      newPriorities = [value];
    }
    
    const newFilters = { ...filters, priority: newPriorities };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Handle custom date range changes
  const handleCustomDateChange = (startDate: Date | null, endDate: Date | null) => {
    const newFilters = { 
      ...filters, 
      customStartDate: startDate, 
      customEndDate: endDate 
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Reset all filters
  const resetFilters = () => {
    const defaultFilters = {
      search: "",
      timeRange: "all" as TimeRange,
      categories: [],
      completed: "all" as CompletedFilter,
      priority: [1, 2, 3],
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reminders, descriptions, or tags..."
            className="pl-9 pr-4"
            value={filters.search}
            onChange={handleSearchChange}
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => {
                const newFilters = { ...filters, search: "" };
                setFilters(newFilters);
                onFilterChange(newFilters);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-shrink-0">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent className="w-[300px] sm:w-[400px] sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Filter Reminders</SheetTitle>
              <SheetDescription>
                Narrow down your reminders by various criteria
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-6 space-y-6">
              {/* Time Range Filter */}
              <div className="space-y-2">
                <Label>Time Range</Label>
                <Select 
                  value={filters.timeRange} 
                  onValueChange={handleTimeRangeChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                
                {filters.timeRange === "custom" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Start Date</Label>
                      <DatePicker 
                        date={filters.customStartDate} 
                        setDate={(date) => handleCustomDateChange(date, filters.customEndDate)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End Date</Label>
                      <DatePicker 
                        date={filters.customEndDate} 
                        setDate={(date) => handleCustomDateChange(filters.customStartDate, date)} 
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Categories Filter */}
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {!loadingCategories && categories.map((category) => (
                    <Button
                      key={category.id}
                      variant="outline"
                      className={cn(
                        "justify-start",
                        filters.categories.includes(category.id) && "border-primary bg-primary/10"
                      )}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      {filters.categories.includes(category.id) && (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      <span className="flex items-center">
                        {category.emoji && <span className="mr-1">{category.emoji}</span>}
                        <span 
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: category.color }}
                        ></span>
                        {category.name}
                      </span>
                    </Button>
                  ))}
                  {loadingCategories && (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="h-9 bg-muted animate-pulse rounded-md"></div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Completion Status Filter */}
              <div className="space-y-2">
                <Label>Completion Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className={cn(
                      filters.completed === "all" && "border-primary bg-primary/10"
                    )}
                    onClick={() => handleCompletedChange("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      filters.completed === "completed" && "border-primary bg-primary/10"
                    )}
                    onClick={() => handleCompletedChange("completed")}
                  >
                    Completed
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      filters.completed === "incomplete" && "border-primary bg-primary/10"
                    )}
                    onClick={() => handleCompletedChange("incomplete")}
                  >
                    Incomplete
                  </Button>
                </div>
              </div>
              
              {/* Priority Filter */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1",
                      filters.priority.includes(1) && "border-blue-500 bg-blue-500/10 text-blue-500"
                    )}
                    onClick={() => handlePriorityChange(1)}
                  >
                    Low
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1",
                      filters.priority.includes(2) && "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                    )}
                    onClick={() => handlePriorityChange(2)}
                  >
                    Medium
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1",
                      filters.priority.includes(3) && "border-red-500 bg-red-500/10 text-red-500"
                    )}
                    onClick={() => handlePriorityChange(3)}
                  >
                    High
                  </Button>
                </div>
              </div>
            </div>
            
            <SheetFooter>
              <div className="flex justify-between w-full">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <SheetClose asChild>
                  <Button>Apply Filters</Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.timeRange !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>
                {filters.timeRange === "today" && "Today"}
                {filters.timeRange === "tomorrow" && "Tomorrow"}
                {filters.timeRange === "this-week" && "This Week"}
                {filters.timeRange === "this-month" && "This Month"}
                {filters.timeRange === "overdue" && "Overdue"}
                {filters.timeRange === "custom" && "Custom Range"}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 ml-1" 
                onClick={() => handleTimeRangeChange("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.categories.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>
                {filters.categories.length} {filters.categories.length === 1 ? "Category" : "Categories"}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 ml-1" 
                onClick={() => {
                  const newFilters = { ...filters, categories: [] };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.completed !== "all" && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>
                {filters.completed === "completed" ? "Completed" : "Incomplete"}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 ml-1" 
                onClick={() => handleCompletedChange("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.priority.length < 3 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <span>
                Priority: {filters.priority.map(p => 
                  p === 1 ? "Low" : p === 2 ? "Medium" : "High"
                ).join(", ")}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-4 w-4 p-0 ml-1" 
                onClick={() => {
                  const newFilters = { ...filters, priority: [1, 2, 3] };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-6 px-2" 
            onClick={resetFilters}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}