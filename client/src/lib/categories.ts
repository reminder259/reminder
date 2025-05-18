import { ReminderCategory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  emoji?: string;
  isDefault: boolean;
}

// Default categories that match the database default categories
export const defaultCategories: Record<ReminderCategory, CategoryInfo> = {
  work: {
    id: 'work',
    name: 'Work',
    color: 'hsl(var(--primary))',
    bgColor: 'bg-primary',
    textColor: 'text-primary-foreground',
    emoji: '💼',
    isDefault: true
  },
  health: {
    id: 'health',
    name: 'Health',
    color: '#4caf50',
    bgColor: 'bg-[#4caf50]',
    textColor: 'text-white',
    emoji: '💪',
    isDefault: true
  },
  study: {
    id: 'study',
    name: 'Study',
    color: '#ff9800',
    bgColor: 'bg-[#ff9800]',
    textColor: 'text-white',
    emoji: '📚',
    isDefault: true
  },
  personal: {
    id: 'personal',
    name: 'Personal',
    color: 'hsl(var(--secondary))',
    bgColor: 'bg-secondary',
    textColor: 'text-secondary-foreground',
    emoji: '🏠',
    isDefault: true
  }
};

// Generate tailwind class from color string
export function generateTailwindClasses(color: string): { bgColor: string, textColor: string } {
  // For HSL values, use the tailwind variable
  if (color.startsWith('hsl(var(')) {
    const varName = color.match(/--([a-z-]+)/)?.[1];
    if (varName) {
      return {
        bgColor: `bg-${varName}`,
        textColor: `text-${varName}-foreground`
      };
    }
  }

  // For hex values, create a custom bg class
  return {
    bgColor: `bg-[${color}]`,
    textColor: isLightColor(color) ? 'text-gray-900' : 'text-white'
  };
}

// Determine if a hex color is light or dark
function isLightColor(color: string): boolean {
  // Convert hex to RGB
  let r = 0, g = 0, b = 0;
  
  if (color.startsWith('#')) {
    // Expand shorthand form (e.g. "#03F") to full form (e.g. "#0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    color = color.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (result) {
      r = parseInt(result[1], 16);
      g = parseInt(result[2], 16);
      b = parseInt(result[3], 16);
    }
  } else {
    // For HSL or other values, default to dark
    return false;
  }

  // Calculate perceived brightness using the formula: (R*299 + G*587 + B*114) / 1000
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return true if the color is light (brightness > 155)
  return brightness > 155;
}

// Function to get default category by ID
export function getDefaultCategoryById(id: string): CategoryInfo | undefined {
  // Try to find in default categories
  if (id in defaultCategories) {
    return defaultCategories[id as ReminderCategory];
  }
  
  // If not found, return undefined
  return undefined;
}

// Hook to get all categories (default + custom)
export function useCategories() {
  const { data = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/categories'],
  });

  // Combine default categories with custom categories
  const allCategories = [
    ...Object.values(defaultCategories),
    ...data.map((cat: any) => ({
      id: cat.id.toString(),
      name: cat.name,
      color: cat.color,
      bgColor: generateTailwindClasses(cat.color).bgColor,
      textColor: generateTailwindClasses(cat.color).textColor,
      emoji: cat.emoji,
      isDefault: cat.isDefault
    }))
  ];

  return {
    categories: allCategories,
    isLoading,
    error
  };
}

// Hook to get a category by ID
export function useCategoryById(id: string) {
  const { categories, isLoading } = useCategories();
  
  // Find the category by ID
  const category = categories.find(cat => cat.id === id || cat.name.toLowerCase() === id.toLowerCase());
  
  // If not found, return a default "unknown" category
  const unknownCategory: CategoryInfo = {
    id: 'unknown',
    name: 'Unknown',
    color: '#9e9e9e',
    bgColor: 'bg-gray-500',
    textColor: 'text-white',
    emoji: '❓',
    isDefault: false
  };
  
  return {
    category: category || unknownCategory,
    isLoading
  };
}
