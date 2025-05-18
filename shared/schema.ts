import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for reminder properties
export const ReminderCategory = z.enum(["work", "health", "study", "personal"]);
export type ReminderCategory = z.infer<typeof ReminderCategory>;

export const ReminderRecurrence = z.enum(["one-time", "daily", "weekly", "monthly", "custom"]);
export type ReminderRecurrence = z.infer<typeof ReminderRecurrence>;

export const AlertType = z.enum(["notification", "sound", "vibration", "email", "all"]);
export type AlertType = z.infer<typeof AlertType>;

// Define the reminder table schema
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dateTime: timestamp("date_time").notNull(),
  category: text("category", { enum: ["work", "health", "study", "personal"] }).notNull(),
  recurrence: text("recurrence", { enum: ["one-time", "daily", "weekly", "monthly", "custom"] }).notNull(),
  recurrenceRule: text("recurrence_rule"),
  alertType: text("alert_type", { enum: ["notification", "sound", "vibration", "email", "all"] }).notNull(),
  alertSound: text("alert_sound").default("default"),
  voiceNote: text("voice_note"),
  image: text("image"),
  completed: boolean("completed").notNull().default(false),
  priority: integer("priority").default(1), // 1-low, 2-medium, 3-high
  tags: text("tags").array(),
  snoozeUntil: timestamp("snooze_until"),
  remindBefore: integer("remind_before").default(15), // minutes
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastModified: timestamp("last_modified").defaultNow(),
});

// Define subtasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  reminderId: integer("reminder_id").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define categories table - custom user categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  emoji: text("emoji"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define the settings table schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  darkMode: boolean("dark_mode").notNull().default(false),
  showCompleted: boolean("show_completed").notNull().default(true),
  startWeekOnMonday: boolean("start_week_on_monday").notNull().default(false),
  soundAlerts: boolean("sound_alerts").notNull().default(true),
  visualNotifications: boolean("visual_notifications").notNull().default(true),
  emailNotifications: boolean("email_notifications").default(false),
  emailAddress: text("email_address"),
  advanceReminderMinutes: integer("advance_reminder_minutes").notNull().default(15),
  currentThemeId: integer("current_theme_id"),
  pomodoroWorkMinutes: integer("pomodoro_work_minutes").default(25),
  pomodoroBreakMinutes: integer("pomodoro_break_minutes").default(5),
  pomodoroLongBreakMinutes: integer("pomodoro_long_break_minutes").default(15),
  pomodoroSessions: integer("pomodoro_sessions").default(4),
  enabledBadges: boolean("enabled_badges").default(true),
});

// Define quotes table
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  author: text("author"),
  image: text("image"),
  isFavorite: boolean("is_favorite").default(false),
  userAdded: boolean("user_added").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define pomodoro sessions table
export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  reminderId: integer("reminder_id"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration").notNull(), // in seconds
  completed: boolean("completed").default(false),
  type: text("type", { enum: ["work", "break", "long-break"] }).notNull(),
  notes: text("notes"),
});

// Define user badges/rewards
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  criteria: text("criteria").notNull(),
  level: integer("level").default(1),
});

// Define user-earned badges
export const userBadges = pgTable("user_badges", {
  badgeId: integer("badge_id").notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  level: integer("level").default(1),
  progress: integer("progress").default(0),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.badgeId] }),
  };
});

// Define themes table
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  primaryColor: text("primary_color").notNull(),
  secondaryColor: text("secondary_color").notNull(),
  backgroundColor: text("background_color").notNull(),
  textColor: text("text_color").notNull(),
  accentColor: text("accent_color").notNull(),
  isDefault: boolean("is_default").default(false),
  isLight: boolean("is_light").default(true),
});

// Define goals table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: real("target_value").notNull().default(1.0),
  currentProgress: real("current_progress").default(0.0),
  unit: text("unit").default("times"),
  completed: boolean("completed").default(false),
  category: text("category"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  repeatFrequency: text("repeat_frequency", { enum: ["daily", "weekly", "monthly", "none"] }).default("none"),
  relatedReminders: integer("related_reminders").array(),
});

// Define statistics table for analytics
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  totalReminders: integer("total_reminders").default(0),
  completedReminders: integer("completed_reminders").default(0),
  categoryBreakdown: jsonb("category_breakdown").default({}),
  focusTime: integer("focus_time").default(0), // in minutes
  streakDays: integer("streak_days").default(0),
  productivity: real("productivity").default(0.0), // 0-1 ratio
});

// Create Zod schemas for validation and type inference
export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  lastModified: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessions).omit({
  id: true,
});

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
});

export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
});

export const insertStatisticsSchema = createInsertSchema(statistics).omit({
  id: true,
});

// Define types to be used across the application
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = z.infer<typeof insertThemeSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Statistic = typeof statistics.$inferSelect;
export type InsertStatistic = z.infer<typeof insertStatisticsSchema>;

// Custom schemas
export const reminderFormSchema = insertReminderSchema.extend({
  dateTime: z.coerce.date(),
});
