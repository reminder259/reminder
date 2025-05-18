import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RemindersList } from "@/components/reminders-list";
import { ReminderModal } from "@/components/reminder-modal";
import { Plus } from "lucide-react";

export default function Reminders() {
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setReminderModalOpen(true)}>
          <Plus className="h-5 w-5 mr-2" />
          New Reminder
        </Button>
      </div>
      
      {/* All Reminders */}
      <RemindersList title="All Reminders" />
      
      {/* New Reminder Modal */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
      />
    </div>
  );
}
