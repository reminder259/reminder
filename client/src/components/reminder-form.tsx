import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-picker";
import { AudioRecorder } from "@/components/audio-recorder";
import { Reminder, reminderFormSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReminderFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialData?: Reminder;
}

export function ReminderForm({ onSave, onCancel, initialData }: ReminderFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with default values or existing reminder data
  const form = useForm({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      dateTime: new Date(initialData.dateTime)
    } : {
      title: "",
      description: "",
      dateTime: new Date(),
      category: "personal",
      recurrence: "one-time",
      alertType: "notification",
      completed: false,
      voiceNote: undefined
    }
  });

  // Handle form submission
  const onSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      
      if (initialData) {
        // Update existing reminder
        await apiRequest("PATCH", `/api/reminders/${initialData.id}`, data);
        toast({
          title: "Reminder updated",
          description: "Your reminder has been updated successfully."
        });
      } else {
        // Create new reminder
        await apiRequest("POST", "/api/reminders", data);
        toast({
          title: "Reminder created",
          description: "Your new reminder has been created."
        });
      }
      
      // Immediately refresh data across components
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      
      onSave();
    } catch (error) {
      console.error("Error saving reminder:", error);
      toast({
        title: "Error",
        description: "Failed to save your reminder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle audio recording
  const handleAudioRecorded = (audioData: string) => {
    form.setValue("voiceNote", audioData, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter reminder title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter description" 
                  rows={3} 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dateTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time</FormLabel>
                <FormControl>
                  <DateTimePicker 
                    date={field.value} 
                    setDate={(date) => date && field.onChange(date)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recurrence</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="alertType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select alert type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="sound">Sound</SelectItem>
                    <SelectItem value="vibration">Vibration</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="voiceNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Voice Note</FormLabel>
              <FormControl>
                <AudioRecorder 
                  onAudioRecorded={handleAudioRecorded} 
                  existingAudio={field.value || undefined}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : initialData ? "Update Reminder" : "Save Reminder"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
