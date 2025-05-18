import { 
  Reminder, InsertReminder, 
  Settings, InsertSettings,
  Quote, InsertQuote, 
  reminders, settings, quotes,
  categories, InsertCategory, Category,
  tasks, InsertTask, Task,
  pomodoroSessions, InsertPomodoroSession, PomodoroSession,
  themes, InsertTheme, Theme,
  goals, InsertGoal, Goal
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";

// Define the storage interface
export interface IStorage {
  // Reminders
  getReminders(): Promise<Reminder[]>;
  getRemindersByCategory(category: string): Promise<Reminder[]>;
  getRemindersByTimeRange(startDate: Date, endDate: Date): Promise<Reminder[]>;
  getReminderById(id: number): Promise<Reminder | undefined>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, reminder: Partial<InsertReminder>): Promise<Reminder | undefined>;
  toggleReminderCompletion(id: number): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<boolean>;
  bulkUpdateReminders(ids: number[], updates: Partial<InsertReminder>): Promise<boolean>;
  bulkDeleteReminders(ids: number[]): Promise<boolean>;
  
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
  
  // Quotes
  getQuotes(): Promise<Quote[]>;
  getRandomQuote(): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Tasks (Subtasks)
  getTasks(reminderId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  toggleTaskCompletion(id: number): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Pomodoro
  getPomodoroSessions(): Promise<PomodoroSession[]>;
  getPomodoroSessionsByReminder(reminderId: number): Promise<PomodoroSession[]>;
  createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession>;
  updatePomodoroSession(id: number, session: Partial<InsertPomodoroSession>): Promise<PomodoroSession | undefined>;
  deletePomodoroSession(id: number): Promise<boolean>;
  
  // Themes
  getThemes(): Promise<Theme[]>;
  getThemeById(id: number): Promise<Theme | undefined>;
  createTheme(theme: InsertTheme): Promise<Theme>;
  updateTheme(id: number, theme: Partial<InsertTheme>): Promise<Theme | undefined>;
  deleteTheme(id: number): Promise<boolean>;
  
  // Goals
  getGoals(): Promise<Goal[]>;
  getGoalById(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  updateGoalProgress(id: number, increment: number): Promise<Goal | undefined>;
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  
  // Reminder methods
  async getReminders(): Promise<Reminder[]> {
    return await db.select().from(reminders).orderBy(reminders.dateTime);
  }

  async getRemindersByCategory(category: string): Promise<Reminder[]> {
    return await db.select()
      .from(reminders)
      .where(eq(reminders.category, category))
      .orderBy(reminders.dateTime);
  }
  
  async getRemindersByTimeRange(startDate: Date, endDate: Date): Promise<Reminder[]> {
    return await db.select()
      .from(reminders)
      .where(and(
        gte(reminders.dateTime, startDate),
        lte(reminders.dateTime, endDate)
      ))
      .orderBy(reminders.dateTime);
  }

  async getReminderById(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select()
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);
    return reminder;
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders)
      .values(reminder)
      .returning();
    return newReminder;
  }

  async updateReminder(id: number, reminderUpdate: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [updatedReminder] = await db.update(reminders)
      .set(reminderUpdate)
      .where(eq(reminders.id, id))
      .returning();
    return updatedReminder;
  }

  async toggleReminderCompletion(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select()
      .from(reminders)
      .where(eq(reminders.id, id))
      .limit(1);
    
    if (!reminder) return undefined;
    
    const [updatedReminder] = await db.update(reminders)
      .set({ completed: !reminder.completed })
      .where(eq(reminders.id, id))
      .returning();
    
    return updatedReminder;
  }

  async deleteReminder(id: number): Promise<boolean> {
    const result = await db.delete(reminders)
      .where(eq(reminders.id, id))
      .returning({ id: reminders.id });
    
    return result.length > 0;
  }
  
  async bulkUpdateReminders(ids: number[], updates: Partial<InsertReminder>): Promise<boolean> {
    const result = await db.update(reminders)
      .set(updates)
      .where(inArray(reminders.id, ids))
      .returning({ id: reminders.id });
    
    return result.length === ids.length;
  }
  
  async bulkDeleteReminders(ids: number[]): Promise<boolean> {
    const result = await db.delete(reminders)
      .where(inArray(reminders.id, ids))
      .returning({ id: reminders.id });
    
    return result.length === ids.length;
  }

  // Settings methods
  async getSettings(): Promise<Settings> {
    const [existingSettings] = await db.select().from(settings).limit(1);
    
    if (existingSettings) return existingSettings;
    
    // Create default settings if none exist
    const defaultSettings: InsertSettings = {
      darkMode: false,
      showCompleted: true,
      startWeekOnMonday: false,
      soundAlerts: true,
      visualNotifications: true,
      advanceReminderMinutes: 15
    };
    
    const [newSettings] = await db.insert(settings)
      .values(defaultSettings)
      .returning();
      
    return newSettings;
  }

  async updateSettings(settingsUpdate: Partial<InsertSettings>): Promise<Settings> {
    const [existingSettings] = await db.select().from(settings).limit(1);
    
    if (existingSettings) {
      const [updatedSettings] = await db.update(settings)
        .set(settingsUpdate)
        .where(eq(settings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    }
    
    // Create settings with the updates if none exist
    const defaultSettings: InsertSettings = {
      darkMode: settingsUpdate.darkMode ?? false,
      showCompleted: settingsUpdate.showCompleted ?? true,
      startWeekOnMonday: settingsUpdate.startWeekOnMonday ?? false,
      soundAlerts: settingsUpdate.soundAlerts ?? true,
      visualNotifications: settingsUpdate.visualNotifications ?? true,
      advanceReminderMinutes: settingsUpdate.advanceReminderMinutes ?? 15
    };
    
    const [newSettings] = await db.insert(settings)
      .values(defaultSettings)
      .returning();
      
    return newSettings;
  }

  // Quote methods
  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes);
  }

  async getRandomQuote(): Promise<Quote | undefined> {
    // Using PostgreSQL's RANDOM() function to get a random quote
    const [randomQuote] = await db.select()
      .from(quotes)
      .orderBy(sql`RANDOM()`)
      .limit(1);
      
    return randomQuote;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db.insert(quotes)
      .values(quote)
      .returning();
    return newQuote;
  }

  // Categories methods
  async getCategories(): Promise<Category[]> {
    const result = await db.select().from(categories);
    
    // If no categories exist, create default ones
    if (result.length === 0) {
      await this.createDefaultCategories();
      return await db.select().from(categories);
    }
    
    return result;
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, categoryUpdate: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db.update(categories)
      .set(categoryUpdate)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    
    return result.length > 0;
  }

  private async createDefaultCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: 'Work', color: 'hsl(240, 50%, 50%)', emoji: '💼', isDefault: true },
      { name: 'Health', color: '#4caf50', emoji: '💪', isDefault: true },
      { name: 'Study', color: '#ff9800', emoji: '📚', isDefault: true },
      { name: 'Personal', color: 'hsl(307, 59%, 60%)', emoji: '🏠', isDefault: true }
    ];
    
    await db.insert(categories).values(defaultCategories);
  }

  // Tasks (Subtasks) methods
  async getTasks(reminderId: number): Promise<Task[]> {
    return await db.select()
      .from(tasks)
      .where(eq(tasks.reminderId, reminderId))
      .orderBy(tasks.position);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db.update(tasks)
      .set(taskUpdate)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async toggleTaskCompletion(id: number): Promise<Task | undefined> {
    const [task] = await db.select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    
    if (!task) return undefined;
    
    const [updatedTask] = await db.update(tasks)
      .set({ completed: !task.completed })
      .where(eq(tasks.id, id))
      .returning();
    
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    
    return result.length > 0;
  }

  // Pomodoro methods
  async getPomodoroSessions(): Promise<PomodoroSession[]> {
    return await db.select()
      .from(pomodoroSessions)
      .orderBy(desc(pomodoroSessions.startTime));
  }

  async getPomodoroSessionsByReminder(reminderId: number): Promise<PomodoroSession[]> {
    return await db.select()
      .from(pomodoroSessions)
      .where(eq(pomodoroSessions.reminderId, reminderId))
      .orderBy(desc(pomodoroSessions.startTime));
  }

  async createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession> {
    const [newSession] = await db.insert(pomodoroSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updatePomodoroSession(id: number, sessionUpdate: Partial<InsertPomodoroSession>): Promise<PomodoroSession | undefined> {
    const [updatedSession] = await db.update(pomodoroSessions)
      .set(sessionUpdate)
      .where(eq(pomodoroSessions.id, id))
      .returning();
    return updatedSession;
  }

  async deletePomodoroSession(id: number): Promise<boolean> {
    const result = await db.delete(pomodoroSessions)
      .where(eq(pomodoroSessions.id, id))
      .returning({ id: pomodoroSessions.id });
    
    return result.length > 0;
  }

  // Themes methods
  async getThemes(): Promise<Theme[]> {
    const result = await db.select().from(themes);
    
    // If no themes exist, create default ones
    if (result.length === 0) {
      await this.createDefaultThemes();
      return await db.select().from(themes);
    }
    
    return result;
  }

  async getThemeById(id: number): Promise<Theme | undefined> {
    const [theme] = await db.select()
      .from(themes)
      .where(eq(themes.id, id))
      .limit(1);
    return theme;
  }

  async createTheme(theme: InsertTheme): Promise<Theme> {
    const [newTheme] = await db.insert(themes)
      .values(theme)
      .returning();
    return newTheme;
  }

  async updateTheme(id: number, themeUpdate: Partial<InsertTheme>): Promise<Theme | undefined> {
    const [updatedTheme] = await db.update(themes)
      .set(themeUpdate)
      .where(eq(themes.id, id))
      .returning();
    return updatedTheme;
  }

  async deleteTheme(id: number): Promise<boolean> {
    const result = await db.delete(themes)
      .where(eq(themes.id, id))
      .returning({ id: themes.id });
    
    return result.length > 0;
  }

  private async createDefaultThemes() {
    const defaultThemes: InsertTheme[] = [
      {
        name: 'Default Light',
        isDefault: true,
        isLight: true,
        primaryColor: 'hsl(240, 50%, 50%)',
        secondaryColor: 'hsl(307, 59%, 60%)',
        backgroundColor: 'hsl(0, 0%, 100%)',
        textColor: 'hsl(20, 14.3%, 4.1%)',
        accentColor: 'hsl(60, 4.8%, 95.9%)'
      },
      {
        name: 'Default Dark',
        isDefault: true,
        isLight: false,
        primaryColor: 'hsl(213, 90%, 54%)',
        secondaryColor: 'hsl(326, 100%, 74%)',
        backgroundColor: 'hsl(240, 10%, 3.9%)',
        textColor: 'hsl(0, 0%, 98%)',
        accentColor: 'hsl(240, 3.7%, 15.9%)'
      },
      {
        name: 'Nature Green',
        isDefault: false,
        isLight: true,
        primaryColor: 'hsl(142, 71%, 45%)',
        secondaryColor: 'hsl(31, 100%, 50%)',
        backgroundColor: 'hsl(0, 0%, 100%)',
        textColor: 'hsl(128, 14%, 12%)',
        accentColor: 'hsl(120, 12%, 95%)'
      },
      {
        name: 'Ocean Blue',
        isDefault: false,
        isLight: true,
        primaryColor: 'hsl(200, 80%, 50%)',
        secondaryColor: 'hsl(180, 71%, 45%)',
        backgroundColor: 'hsl(210, 50%, 98%)',
        textColor: 'hsl(215, 25%, 15%)',
        accentColor: 'hsl(210, 16%, 92%)'
      }
    ];
    
    await db.insert(themes).values(defaultThemes);
  }

  // Goals methods
  async getGoals(): Promise<Goal[]> {
    return await db.select().from(goals);
  }

  async getGoalById(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select()
      .from(goals)
      .where(eq(goals.id, id))
      .limit(1);
    return goal;
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db.insert(goals)
      .values(goal)
      .returning();
    return newGoal;
  }

  async updateGoal(id: number, goalUpdate: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updatedGoal] = await db.update(goals)
      .set(goalUpdate)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await db.delete(goals)
      .where(eq(goals.id, id))
      .returning({ id: goals.id });
    
    return result.length > 0;
  }
  
  async updateGoalProgress(id: number, increment: number): Promise<Goal | undefined> {
    const [goal] = await db.select()
      .from(goals)
      .where(eq(goals.id, id))
      .limit(1);
    
    if (!goal) return undefined;
    
    const newProgress = Math.min(goal.currentProgress + increment, goal.targetValue);
    
    const [updatedGoal] = await db.update(goals)
      .set({ 
        currentProgress: newProgress,
        completed: newProgress >= goal.targetValue
      })
      .where(eq(goals.id, id))
      .returning();
    
    return updatedGoal;
  }
}

// Add initial quotes if they don't exist
async function addInitialQuotes() {
  const existingQuotes = await db.select().from(quotes);
  
  if (existingQuotes.length === 0) {
    const initialQuotes: InsertQuote[] = [
      { text: "The key to keeping your balance is knowing when you've lost it.", author: "Anonymous" },
      { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
      { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
      { text: "When something is important enough, you do it even if the odds are not in your favor.", author: "Elon Musk" }
    ];
    
    await db.insert(quotes).values(initialQuotes);
  }
}

// Initialize database with initial data
addInitialQuotes().catch(console.error);

// Export a singleton instance of the storage
export const storage = new DatabaseStorage();
