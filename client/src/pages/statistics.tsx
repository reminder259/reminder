import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { CategoryChart } from "@/components/category-chart";
import { useCategories } from "@/lib/categories";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Statistics() {
  const [timeRange, setTimeRange] = useState("week");
  const [view, setView] = useState("overview");
  
  // Fetch reminders
  const { data: reminders = [], isLoading: remindersLoading } = useQuery<any[]>({
    queryKey: ['/api/reminders'],
  });

  // Fetch pomodoro sessions
  const { data: pomodoroSessions = [], isLoading: pomodoroLoading } = useQuery<any[]>({
    queryKey: ['/api/pomodoro'],
  });

  // Get categories 
  const { categories, isLoading: categoriesLoading } = useCategories();
  
  const isLoading = remindersLoading || pomodoroLoading || categoriesLoading;

  // Generate date filters
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
    
    if (timeRange === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    return { startDate, endDate: now };
  };

  // Filter reminders by date range
  const filterByDateRange = (items: any[], dateField: string = "dateTime") => {
    const { startDate } = getDateRange();
    return items.filter(item => new Date(item[dateField]) >= startDate);
  };

  // Calculate basic stats
  const totalReminders = reminders.length;
  const completedReminders = reminders.filter(r => r.completed).length;
  const completionRate = totalReminders > 0 ? (completedReminders / totalReminders * 100).toFixed(1) : "0";

  // Calculate pomodoro stats
  const filteredSessions = filterByDateRange(pomodoroSessions, "startTime");
  const totalFocusTime = filteredSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60; // in minutes
  const totalSessions = filteredSessions.length;

  // Prepare category data for charts
  const categoryData = categories.map(cat => ({
    name: cat.name,
    count: reminders.filter(r => r.category === cat.id).length,
    completed: reminders.filter(r => r.category === cat.id && r.completed).length,
    color: cat.color
  })).filter(cat => cat.count > 0);

  // Prepare productivity by day of week
  const getDayOfWeek = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const productivityByDay = Array(7).fill(0).map((_, i) => {
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
    const dayReminders = reminders.filter(r => {
      const reminderDay = getDayOfWeek(new Date(r.dateTime));
      return reminderDay === day;
    });
    
    const dayCompleted = dayReminders.filter(r => r.completed).length;
    const dayTotal = dayReminders.length;
    
    return {
      name: day,
      completed: dayCompleted,
      total: dayTotal,
      rate: dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Statistics & Analytics</h1>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs value={view} onValueChange={setView}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="pomodoro">Focus Time</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalReminders}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedReminders}</div>
                <div className="text-xs text-muted-foreground">{completionRate}% completion rate</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Focus Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalSessions}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Focus Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalFocusTime.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">minutes</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Productivity by Day</CardTitle>
                <CardDescription>Completion rate by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productivityByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                      <Legend />
                      <Bar dataKey="rate" name="Completion Rate (%)" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Categories Distribution</CardTitle>
                <CardDescription>Reminders by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color.startsWith('#') ? entry.color : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Completion by Category</CardTitle>
              <CardDescription>Completed vs total reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#4caf50" />
                    <Bar dataKey="count" name="Total" stackId="a" fill="#ff9800" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="productivity" className="space-y-6">
          {/* Productivity tab content */}
          <Card>
            <CardHeader>
              <CardTitle>Productivity Over Time</CardTitle>
              <CardDescription>Completion rate trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {/* Placeholder for additional charts */}
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  More detailed productivity analytics will appear here as you complete more reminders.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          {/* Categories detailed view */}
          <CategoryChart />
        </TabsContent>
        
        <TabsContent value="pomodoro" className="space-y-6">
          {/* Pomodoro Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Focus Time Analytics</CardTitle>
              <CardDescription>Pomodoro sessions statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoading || pomodoroSessions.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Complete focus sessions to see detailed analytics here.
                  </div>
                ) : (
                  <div className="text-center">Focus sessions data visualization will appear here.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}