import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertReminderSchema, 
  insertSettingsSchema, 
  insertQuoteSchema,
  insertCategorySchema,
  insertTaskSchema,
  insertPomodoroSessionSchema,
  insertThemeSchema,
  insertGoalSchema,
  reminderFormSchema
} from "@shared/schema";

// Helper function to handle errors
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export async function registerRoutes(app: Express): Promise<Server> {
  // Reminder routes
  app.get('/api/reminders', asyncHandler(async (req, res) => {
    // Filter by date range if provided
    if (req.query.start && req.query.end) {
      const startDate = new Date(req.query.start as string);
      const endDate = new Date(req.query.end as string);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date range' });
      }
      
      const reminders = await storage.getRemindersByTimeRange(startDate, endDate);
      return res.json(reminders);
    }
    
    const reminders = await storage.getReminders();
    res.json(reminders);
  }));

  app.get('/api/reminders/category/:category', asyncHandler(async (req, res) => {
    const category = req.params.category;
    const reminders = await storage.getRemindersByCategory(category);
    res.json(reminders);
  }));

  app.get('/api/reminders/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID' });
    }

    const reminder = await storage.getReminderById(id);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json(reminder);
  }));

  app.post('/api/reminders', asyncHandler(async (req, res) => {
    const validatedData = reminderFormSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid reminder data',
        errors: validatedData.error.errors
      });
    }

    const reminder = await storage.createReminder(validatedData.data);
    res.status(201).json(reminder);
  }));

  app.patch('/api/reminders/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID' });
    }

    // Validate partial update data
    const validatedData = insertReminderSchema.partial().safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid reminder data',
        errors: validatedData.error.errors
      });
    }

    const updatedReminder = await storage.updateReminder(id, validatedData.data);
    if (!updatedReminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json(updatedReminder);
  }));

  app.patch('/api/reminders/:id/toggle', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID' });
    }

    const updatedReminder = await storage.toggleReminderCompletion(id);
    if (!updatedReminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json(updatedReminder);
  }));

  app.patch('/api/reminders/:id/snooze', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID' });
    }

    const { minutes } = req.body;
    if (!minutes || isNaN(parseInt(minutes))) {
      return res.status(400).json({ message: 'Invalid snooze time' });
    }

    const reminder = await storage.getReminderById(id);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Calculate new snooze time
    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + parseInt(minutes));

    const updatedReminder = await storage.updateReminder(id, { snoozeUntil });
    if (!updatedReminder) {
      return res.status(404).json({ message: 'Failed to snooze reminder' });
    }

    res.json(updatedReminder);
  }));

  app.delete('/api/reminders/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reminder ID' });
    }

    const success = await storage.deleteReminder(id);
    if (!success) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.status(204).send();
  }));

  // Bulk operations for reminders
  app.post('/api/reminders/bulk/update', asyncHandler(async (req, res) => {
    const { ids, updates } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid reminder IDs' });
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }
    
    const parsedIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    const validatedData = insertReminderSchema.partial().safeParse(updates);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid update data',
        errors: validatedData.error.errors
      });
    }
    
    const success = await storage.bulkUpdateReminders(parsedIds, validatedData.data);
    if (!success) {
      return res.status(404).json({ message: 'Failed to update some reminders' });
    }
    
    res.status(200).json({ message: 'Reminders updated successfully' });
  }));
  
  app.post('/api/reminders/bulk/delete', asyncHandler(async (req, res) => {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid reminder IDs' });
    }
    
    const parsedIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    const success = await storage.bulkDeleteReminders(parsedIds);
    if (!success) {
      return res.status(404).json({ message: 'Failed to delete some reminders' });
    }
    
    res.status(200).json({ message: 'Reminders deleted successfully' });
  }));

  // Task (subtask) routes
  app.get('/api/reminders/:reminderId/tasks', asyncHandler(async (req, res) => {
    const reminderId = parseInt(req.params.reminderId);
    if (isNaN(reminderId)) {
      return res.status(400).json({ message: 'Invalid reminder ID' });
    }
    
    const tasks = await storage.getTasks(reminderId);
    res.json(tasks);
  }));
  
  app.post('/api/tasks', asyncHandler(async (req, res) => {
    const validatedData = insertTaskSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid task data',
        errors: validatedData.error.errors
      });
    }
    
    const task = await storage.createTask(validatedData.data);
    res.status(201).json(task);
  }));
  
  app.patch('/api/tasks/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    
    const validatedData = insertTaskSchema.partial().safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid task data',
        errors: validatedData.error.errors
      });
    }
    
    const updatedTask = await storage.updateTask(id, validatedData.data);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(updatedTask);
  }));
  
  app.patch('/api/tasks/:id/toggle', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    
    const updatedTask = await storage.toggleTaskCompletion(id);
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(updatedTask);
  }));
  
  app.delete('/api/tasks/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }
    
    const success = await storage.deleteTask(id);
    if (!success) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(204).send();
  }));

  // Category routes
  app.get('/api/categories', asyncHandler(async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  }));
  
  app.get('/api/categories/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    const category = await storage.getCategoryById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  }));
  
  app.post('/api/categories', asyncHandler(async (req, res) => {
    const validatedData = insertCategorySchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid category data',
        errors: validatedData.error.errors
      });
    }
    
    const category = await storage.createCategory(validatedData.data);
    res.status(201).json(category);
  }));
  
  app.patch('/api/categories/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    const validatedData = insertCategorySchema.partial().safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid category data',
        errors: validatedData.error.errors
      });
    }
    
    const updatedCategory = await storage.updateCategory(id, validatedData.data);
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(updatedCategory);
  }));
  
  app.delete('/api/categories/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    const success = await storage.deleteCategory(id);
    if (!success) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(204).send();
  }));

  // Pomodoro routes
  app.get('/api/pomodoro', asyncHandler(async (req, res) => {
    const sessions = await storage.getPomodoroSessions();
    res.json(sessions);
  }));
  
  app.get('/api/pomodoro/reminder/:reminderId', asyncHandler(async (req, res) => {
    const reminderId = parseInt(req.params.reminderId);
    if (isNaN(reminderId)) {
      return res.status(400).json({ message: 'Invalid reminder ID' });
    }
    
    const sessions = await storage.getPomodoroSessionsByReminder(reminderId);
    res.json(sessions);
  }));
  
  app.post('/api/pomodoro', asyncHandler(async (req, res) => {
    const validatedData = insertPomodoroSessionSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid pomodoro session data',
        errors: validatedData.error.errors
      });
    }
    
    const session = await storage.createPomodoroSession(validatedData.data);
    res.status(201).json(session);
  }));
  
  app.patch('/api/pomodoro/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid pomodoro session ID' });
    }
    
    const validatedData = insertPomodoroSessionSchema.partial().safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid pomodoro session data',
        errors: validatedData.error.errors
      });
    }
    
    const updatedSession = await storage.updatePomodoroSession(id, validatedData.data);
    if (!updatedSession) {
      return res.status(404).json({ message: 'Pomodoro session not found' });
    }
    
    res.json(updatedSession);
  }));

  // Theme routes
  app.get('/api/themes', asyncHandler(async (req, res) => {
    const themes = await storage.getThemes();
    res.json(themes);
  }));
  
  app.get('/api/themes/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    const theme = await storage.getThemeById(id);
    if (!theme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    res.json(theme);
  }));
  
  app.post('/api/themes', asyncHandler(async (req, res) => {
    const validatedData = insertThemeSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid theme data',
        errors: validatedData.error.errors
      });
    }
    
    const theme = await storage.createTheme(validatedData.data);
    res.status(201).json(theme);
  }));
  
  app.patch('/api/themes/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid theme ID' });
    }
    
    const validatedData = insertThemeSchema.partial().safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid theme data',
        errors: validatedData.error.errors
      });
    }
    
    const updatedTheme = await storage.updateTheme(id, validatedData.data);
    if (!updatedTheme) {
      return res.status(404).json({ message: 'Theme not found' });
    }
    
    res.json(updatedTheme);
  }));

  // Goal routes
  app.get('/api/goals', asyncHandler(async (req, res) => {
    const goals = await storage.getGoals();
    res.json(goals);
  }));
  
  app.get('/api/goals/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    const goal = await storage.getGoalById(id);
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json(goal);
  }));
  
  app.post('/api/goals', asyncHandler(async (req, res) => {
    const validatedData = insertGoalSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid goal data',
        errors: validatedData.error.errors
      });
    }
    
    const goal = await storage.createGoal(validatedData.data);
    res.status(201).json(goal);
  }));
  
  app.patch('/api/goals/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    const validatedData = insertGoalSchema.partial().safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid goal data',
        errors: validatedData.error.errors
      });
    }
    
    const updatedGoal = await storage.updateGoal(id, validatedData.data);
    if (!updatedGoal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json(updatedGoal);
  }));
  
  app.patch('/api/goals/:id/progress', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    const { increment } = req.body;
    if (increment === undefined || isNaN(parseFloat(increment))) {
      return res.status(400).json({ message: 'Invalid progress increment' });
    }
    
    const updatedGoal = await storage.updateGoalProgress(id, parseFloat(increment));
    if (!updatedGoal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json(updatedGoal);
  }));
  
  app.delete('/api/goals/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }
    
    const success = await storage.deleteGoal(id);
    if (!success) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.status(204).send();
  }));

  // Voice note upload endpoint
  app.post('/api/voice-notes', asyncHandler(async (req, res) => {
    // We'll store the base64 encoded audio data directly in the reminder
    // In a real app, we'd save the file to disk or cloud storage
    const { audioData } = req.body;
    
    if (!audioData) {
      return res.status(400).json({ message: 'No audio data provided' });
    }
    
    // Return the audio data as the voice note path
    res.status(201).json({ voiceNote: audioData });
  }));

  // Image upload endpoint
  app.post('/api/images', asyncHandler(async (req, res) => {
    // We'll store the base64 encoded image data directly in the reminder or quote
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ message: 'No image data provided' });
    }
    
    // Return the image data as the image path
    res.status(201).json({ image: imageData });
  }));

  // Settings routes
  app.get('/api/settings', asyncHandler(async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  }));

  app.patch('/api/settings', asyncHandler(async (req, res) => {
    const validatedData = insertSettingsSchema.partial().safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid settings data',
        errors: validatedData.error.errors
      });
    }

    const updatedSettings = await storage.updateSettings(validatedData.data);
    res.json(updatedSettings);
  }));

  // Quote routes
  app.get('/api/quotes', asyncHandler(async (req, res) => {
    const quotes = await storage.getQuotes();
    res.json(quotes);
  }));

  app.get('/api/quotes/random', asyncHandler(async (req, res) => {
    const quote = await storage.getRandomQuote();
    if (!quote) {
      return res.status(404).json({ message: 'No quotes found' });
    }
    res.json(quote);
  }));

  app.post('/api/quotes', asyncHandler(async (req, res) => {
    const validatedData = insertQuoteSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ 
        message: 'Invalid quote data',
        errors: validatedData.error.errors
      });
    }

    const quote = await storage.createQuote(validatedData.data);
    res.status(201).json(quote);
  }));

  app.patch('/api/quotes/:id', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid quote ID' });
    }
    
    // There's no updateQuote method in the storage interface, so we'll need to add it
    // For now, we'll respond with a not implemented error
    res.status(501).json({ message: 'Update quote not implemented' });
  }));

  // Data export endpoint
  app.get('/api/export', asyncHandler(async (req, res) => {
    const reminders = await storage.getReminders();
    
    // Format as CSV
    if (req.query.format === 'csv') {
      const headers = 'id,title,description,dateTime,category,recurrence,alertType,completed\n';
      const csvRows = reminders.map(reminder => {
        return `${reminder.id},"${reminder.title}","${reminder.description || ''}","${reminder.dateTime}","${reminder.category}","${reminder.recurrence}","${reminder.alertType}",${reminder.completed}`;
      });
      
      const csv = headers + csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=reminders.csv');
      return res.send(csv);
    }
    
    // Default to JSON
    res.json({ reminders });
  }));

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({ 
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
