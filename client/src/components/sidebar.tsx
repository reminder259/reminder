import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Home, Calendar, ListTodo, Tag, Settings, Search, Plus, Edit, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReminderModal } from "./reminder-modal";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useCategories } from "@/lib/categories";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const [location] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);

  // Get custom categories and default categories
  const { categories: allCategories = [], isLoading: loadingCategories } = useCategories();
  
  // Fetch reminders
  const { data: reminders = [], isLoading: loadingReminders } = useQuery<any[]>({
    queryKey: ['/api/reminders'],
  });

  // Count reminders by category
  const getCategoryCount = (categoryId: string) => {
    if (!reminders || !Array.isArray(reminders)) return 0;
    return reminders.filter((r: any) => r.category === categoryId).length;
  };

  // Close sidebar on mobile when clicking away
  useEffect(() => {
    function handleClickAway(event: MouseEvent) {
      if (window.innerWidth < 768 && open) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setOpen(false);
        }
      }
    }

    document.addEventListener('mousedown', handleClickAway);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
    };
  }, [open, setOpen]);

  const sidebarItems = [
    { path: "/", label: "Dashboard", icon: <Home className="h-5 w-5 mr-3" /> },
    { path: "/calendar", label: "Calendar", icon: <Calendar className="h-5 w-5 mr-3" /> },
    { path: "/reminders", label: "All Reminders", icon: <ListTodo className="h-5 w-5 mr-3" /> },
    { path: "/categories", label: "Categories", icon: <Tag className="h-5 w-5 mr-3" /> },
    { path: "/statistics", label: "Statistics", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> },
    { path: "/pomodoro", label: "Pomodoro", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { path: "/settings", label: "Settings", icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-20 transition-opacity md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      ></div>
      <aside 
        id="sidebar"
        className={cn(
          "w-72 md:w-64 flex-shrink-0 border-r transition-all bg-sidebar fixed md:static h-full z-30 md:z-auto shadow-lg md:shadow-none", 
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <nav className="py-4 h-full flex flex-col">
          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <h3 className="font-semibold">ReminderPro</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)}
                className="md:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative w-full">
              <Input 
                type="text" 
                placeholder="Search reminders..." 
                className="pl-10"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            </div>
          </div>
          
          <div className="px-4 mb-4">
            <Button 
              className="w-full justify-start" 
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Reminder
            </Button>
          </div>
          
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <div className={cn(
                    "flex items-center px-4 py-3 cursor-pointer transition-all",
                    location === item.path 
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "hover:bg-sidebar-accent/50"
                  )}>
                    {item.icon}
                    {item.label}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="border-t mt-5 pt-5 px-4 flex-grow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setEditCategoryOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Categories</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <ul className="space-y-1">
              {!loadingCategories && allCategories.map((category) => (
                <li key={category.id || category.name} className="mb-1">
                  <Link href={`/categories?filter=${category.id}`}>
                    <div className="flex items-center py-2 px-3 rounded-md text-sm transition-all hover:bg-sidebar-accent/50">
                      <span className="flex items-center justify-center mr-2">
                        {category.emoji}
                      </span>
                      <span 
                        className="w-2.5 h-2.5 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      ></span>
                      <span className="truncate">{category.name}</span>
                      <span className="ml-auto bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
                        {getCategoryCount(category.id)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
              {loadingCategories && (
                <>
                  <li className="animate-pulse h-8 bg-muted/50 rounded-md mb-1"></li>
                  <li className="animate-pulse h-8 bg-muted/50 rounded-md mb-1"></li>
                  <li className="animate-pulse h-8 bg-muted/50 rounded-md mb-1"></li>
                  <li className="animate-pulse h-8 bg-muted/50 rounded-md mb-1"></li>
                </>
              )}
            </ul>
          </div>
          
          <div className="mt-auto px-4 pb-4">
            <div className="flex justify-end">
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </aside>
      
      <ReminderModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />

      <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Create, edit, or delete reminder categories
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <CategoryManager onClose={() => setEditCategoryOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Category Manager Component
function CategoryManager({ onClose }: { onClose: () => void }) {
  const { categories, isLoading } = useCategories();
  
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
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="destructive" size="sm">Delete</Button>
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
        <Plus className="mr-2 h-4 w-4" />
        Add New Category
      </Button>
      
      <DialogFooter>
        <Button type="submit" onClick={onClose}>Done</Button>
      </DialogFooter>
    </div>
  );
}
