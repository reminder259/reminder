import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RemindersList } from "@/components/reminders-list";
import { ReminderModal } from "@/components/reminder-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, PlusCircle, Edit, Trash, Settings } from "lucide-react";
import { ReminderCategory } from "@shared/schema";
import { useCategories, defaultCategories } from "@/lib/categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function Categories() {
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [location] = useLocation();
  
  // Get categories data
  const { categories = [], isLoading } = useCategories();
  
  // Parse the category filter from the URL
  const params = new URLSearchParams(location.split('?')[1]);
  const filterParam = params.get('filter') || "work";
  const [activeCategory, setActiveCategory] = useState<string>(filterParam);
  
  // Default to work if the category doesn't exist
  if (!isLoading && !categories.find(c => c.id === activeCategory)) {
    setActiveCategory("work");
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Categories</h1>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setCategoryDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Categories
          </Button>
          
          <Button onClick={() => setReminderModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Reminder
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeCategory} value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-4">
          {!isLoading && categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="min-w-[100px]"
            >
              {category.emoji && <span className="mr-2">{category.emoji}</span>}
              {category.name}
            </TabsTrigger>
          ))}
          {isLoading && (
            <>
              <div className="animate-pulse h-10 w-24 bg-muted/50 rounded-md"></div>
              <div className="animate-pulse h-10 w-24 bg-muted/50 rounded-md"></div>
              <div className="animate-pulse h-10 w-24 bg-muted/50 rounded-md"></div>
              <div className="animate-pulse h-10 w-24 bg-muted/50 rounded-md"></div>
            </>
          )}
        </TabsList>
        
        {!isLoading && categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <RemindersList 
              title={`${category.name} Reminders`} 
              filterCategory={category.id as ReminderCategory} 
              showSearch={true}
              showHeader={true}
            />
          </TabsContent>
        ))}
      </Tabs>
      
      {/* New Reminder Modal */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
      />
      
      {/* Category Management Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Create, edit, or delete categories for your reminders
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <CategoryManager onClose={() => setCategoryDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryManager({ onClose }: { onClose: () => void }) {
  const { categories, isLoading } = useCategories();
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const handleEdit = (category: any) => {
    setEditingCategory(category);
  };
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2">
        {isLoading && (
          <>
            <div className="animate-pulse h-14 bg-muted/50 rounded-md"></div>
            <div className="animate-pulse h-14 bg-muted/50 rounded-md"></div>
            <div className="animate-pulse h-14 bg-muted/50 rounded-md"></div>
          </>
        )}
        
        {!isLoading && categories.map((category) => (
          <div key={category.id} className="border rounded-md p-3 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl mr-2">{category.emoji}</span>
              <span 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: category.color }}
              ></span>
              <span className="font-medium">{category.name}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {!category.isDefault && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              {category.isDefault && (
                <span className="text-xs text-muted-foreground italic">Default</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <Button className="w-full" variant="outline">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New Category
      </Button>
      
      <DialogFooter>
        <Button type="submit" onClick={onClose}>Done</Button>
      </DialogFooter>
      
      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input 
                  id="name" 
                  className="col-span-3"
                  defaultValue={editingCategory.name}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="emoji" className="text-right">Emoji</Label>
                <Input 
                  id="emoji" 
                  className="col-span-3"
                  defaultValue={editingCategory.emoji}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">Color</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input 
                    id="color" 
                    type="color"
                    className="w-16 h-8 p-1"
                    defaultValue={editingCategory.color.startsWith('#') ? editingCategory.color : '#6366f1'}
                  />
                  <Input 
                    id="colorCode" 
                    defaultValue={editingCategory.color}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
              <Button>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
