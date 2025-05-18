import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MotivationalQuote } from "@/components/motivational-quote";
import { ProgressCard } from "@/components/progress-card";
import { CategoryChart } from "@/components/category-chart";
import { RemindersList } from "@/components/reminders-list";
import { ReminderModal } from "@/components/reminder-modal";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  
  // Fetch today's reminders
  const { data: reminders = [] } = useQuery({
    queryKey: ['/api/reminders'],
  });

  // Filter today's reminders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayReminders = reminders.filter((reminder: any) => {
    const reminderDate = new Date(reminder.dateTime);
    reminderDate.setHours(0, 0, 0, 0);
    return reminderDate.getTime() === today.getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setReminderModalOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          New Reminder
        </Button>
      </div>
      
      {/* Motivational quote */}
      <MotivationalQuote />
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <ProgressCard />
        </div>
        
        <div>
          <CategoryChart />
        </div>
        
        <div>
          <RemindersList 
            title="Today's Reminders" 
            maxItems={5} 
            showSearch={false}
          />
        </div>
      </div>
      
      {/* Recent reminders */}
      <RemindersList title="Recent Reminders" maxItems={5} />
      
      {/* New Reminder Modal */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
      />
    </div>
  );
}
