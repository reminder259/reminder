import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Upload, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Settings as SettingsType } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  
  // Fetch settings
  const { data: settings, isLoading } = useQuery<SettingsType>({
    queryKey: ['/api/settings'],
  });

  // Settings update mutation
  const updateSettings = useMutation({
    mutationFn: async (updatedSettings: Partial<SettingsType>) => {
      await apiRequest("PATCH", "/api/settings", updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle settings change
  const handleSettingChange = (key: keyof SettingsType, value: any) => {
    updateSettings.mutate({ [key]: value });
  };

  // Handle data export
  const handleExport = () => {
    window.open('/api/export?format=csv', '_blank');
    toast({
      title: "Exporting data",
      description: "Your reminders are being exported as CSV."
    });
  };

  // Handle data import
  const handleImport = () => {
    // In a real app, we would use a file input
    toast({
      title: "Import not implemented",
      description: "This feature would allow importing reminders from a CSV file.",
      variant: "destructive"
    });
  };

  // Handle clear all data
  const handleClearData = () => {
    if (confirm("Are you sure you want to delete all reminders? This action cannot be undone.")) {
      toast({
        title: "Clear data not implemented",
        description: "In a production app, this would delete all reminders.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array(6).fill(null).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Customize your reminder application experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="darkMode" className="font-medium">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Toggle between dark and light theme</p>
            </div>
            <ThemeToggle />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showCompleted" className="font-medium">Show Completed Reminders</Label>
              <p className="text-sm text-muted-foreground">Display completed items in lists</p>
            </div>
            <Switch 
              id="showCompleted" 
              checked={settings?.showCompleted} 
              onCheckedChange={(checked) => handleSettingChange('showCompleted', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="startWeekOnMonday" className="font-medium">Start Week on Monday</Label>
              <p className="text-sm text-muted-foreground">Change first day of week in calendar</p>
            </div>
            <Switch 
              id="startWeekOnMonday" 
              checked={settings?.startWeekOnMonday} 
              onCheckedChange={(checked) => handleSettingChange('startWeekOnMonday', checked)}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="soundAlerts" className="font-medium">Sound Alerts</Label>
              <p className="text-sm text-muted-foreground">Play sound when reminder is due</p>
            </div>
            <Switch 
              id="soundAlerts" 
              checked={settings?.soundAlerts} 
              onCheckedChange={(checked) => handleSettingChange('soundAlerts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="visualNotifications" className="font-medium">Visual Notifications</Label>
              <p className="text-sm text-muted-foreground">Show pop-up for reminders</p>
            </div>
            <Switch 
              id="visualNotifications" 
              checked={settings?.visualNotifications} 
              onCheckedChange={(checked) => handleSettingChange('visualNotifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="advanceReminder" className="font-medium">Advance Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified ahead of time</p>
            </div>
            <Select 
              value={settings?.advanceReminderMinutes?.toString()} 
              onValueChange={(value) => handleSettingChange('advanceReminderMinutes', parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes before</SelectItem>
                <SelectItem value="15">15 minutes before</SelectItem>
                <SelectItem value="30">30 minutes before</SelectItem>
                <SelectItem value="60">1 hour before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Import, export, or clear your reminder data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/20">
            <h4 className="font-medium mb-2">Export Data</h4>
            <p className="text-sm mb-3 text-muted-foreground">Export all your reminders to a backup file</p>
            <Button onClick={handleExport}>
              <Download className="h-5 w-5 mr-2" />
              Export as CSV
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg bg-muted/20">
            <h4 className="font-medium mb-2">Import Data</h4>
            <p className="text-sm mb-3 text-muted-foreground">Import reminders from a CSV file</p>
            <Button variant="secondary" onClick={handleImport}>
              <Upload className="h-5 w-5 mr-2" />
              Import from CSV
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg bg-muted/20">
            <h4 className="font-medium mb-2 text-destructive">Danger Zone</h4>
            <p className="text-sm mb-3 text-muted-foreground">Permanently delete all reminders</p>
            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="h-5 w-5 mr-2" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
