import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, getDefaultCategoryById } from "@/lib/categories";

export function CategoryChart() {
  const { data: reminders = [], isLoading: loadingReminders } = useQuery({
    queryKey: ['/api/reminders'],
  });

  const { categories, isLoading: loadingCategories } = useCategories();
  const isLoading = loadingReminders || loadingCategories;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-44" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center mb-1 text-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Count reminders by category
  const getCategoryCount = (categoryId: string) => {
    return reminders.filter((r: any) => r.category === categoryId).length;
  };

  // Get all categories with their counts
  const categoryData = categories.map(category => ({
    id: category.id,
    name: category.name,
    color: category.color,
    emoji: category.emoji,
    count: getCategoryCount(category.id),
  }));

  // Calculate total reminders and filter out categories with 0 reminders
  const totalReminders = categoryData.reduce((sum, category) => sum + category.count, 0);
  const nonEmptyCategories = categoryData.filter(cat => cat.count > 0);

  // If no categories with data, show a message
  if (nonEmptyCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          No reminders added yet. Create reminders to see categories breakdown.
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages for non-empty categories
  const categoryDataWithPercentage = nonEmptyCategories.map(category => ({
    ...category,
    percentage: totalReminders > 0 ? Math.round((category.count / totalReminders) * 100) : 0
  }));

  // Sort by count, highest first
  categoryDataWithPercentage.sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categoryDataWithPercentage.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between items-center mb-1 text-sm">
              <span className="flex items-center">
                {item.emoji && <span className="mr-1">{item.emoji}</span>}
                <span 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                ></span>
                {item.name}
              </span>
              <span className="flex items-center">
                <span className="mr-2">{item.count}</span>
                <span className="text-xs text-muted-foreground">
                  ({item.percentage}%)
                </span>
              </span>
            </div>
            <Progress 
              value={item.percentage} 
              className="h-2" 
              style={{ 
                '--progress-background': item.color 
              } as React.CSSProperties} 
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
