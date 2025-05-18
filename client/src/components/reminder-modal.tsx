import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReminderForm } from "@/components/reminder-form";
import { Reminder } from "@shared/schema";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder?: Reminder;
}

export function ReminderModal({ isOpen, onClose, reminder }: ReminderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {reminder ? "Edit Reminder" : "New Reminder"}
          </DialogTitle>
        </DialogHeader>
        
        <ReminderForm 
          onSave={() => {
            // After saving, close the modal and refresh data
            onClose();
          }}
          onCancel={onClose}
          initialData={reminder}
        />
      </DialogContent>
    </Dialog>
  );
}
