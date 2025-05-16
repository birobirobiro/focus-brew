"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  Clock,
  MoreHorizontal,
  ArrowUpDown,
  CheckCheck,
  ListTodo,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from 'next-intl';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

type SortOption = "newest" | "oldest" | "alphabetical";
type FilterOption = "all" | "active" | "completed";

const springAnimation = {
  type: "spring",
  stiffness: 500,
  damping: 30,
} as const;

const formatDate = (dateString: string, t: (key: string, params?: any) => string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays === 0) {
    return t('todoItem.timeLabels.today');
  } else if (diffInDays === 1) {
    return t('todoItem.timeLabels.yesterday');
  } else if (diffInDays < 7) {
    return t('todoItem.timeLabels.daysAgo', { count: diffInDays });
  } else {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }
};

const TodoItem = memo(({ todo, onToggle, onDelete, index }: TodoItemProps) => {
  const t = useTranslations('components.todoApp');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(todo.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{
          ...springAnimation,
          delay: index * 0.05,
        }}
        className={cn(
          "group flex items-start p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0",
          todo.completed && "bg-zinc-50 dark:bg-zinc-900/30"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full p-0 mt-0.5 flex-shrink-0"
          onClick={() => onToggle(todo.id)}
          onKeyDown={(e) => handleKeyDown(e, () => onToggle(todo.id))}
          aria-label={
            todo.completed 
              ? t('todoItem.toggleComplete.markIncomplete')
              : t('todoItem.toggleComplete.markComplete')
          }
          aria-pressed={todo.completed}
        >
          {todo.completed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 transition-colors" />
          ) : (
            <Circle className="h-5 w-5 text-zinc-300 dark:text-zinc-600 transition-colors" />
          )}
        </Button>

        <div className="flex-1 min-w-0 ml-3">
          <div className="flex items-start justify-between">
            <span
              className={cn(
                "text-sm font-medium break-words transition-all duration-200",
                todo.completed &&
                  "line-through text-zinc-400 dark:text-zinc-500"
              )}
            >
              {todo.text}
            </span>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
              className="h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
              aria-label={t('todoItem.delete.button')}
            >
              <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-500 transition-colors" />
            </Button>
          </div>

          <div className="flex items-center mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatDate(todo.createdAt, t)}</span>
          </div>
        </div>
      </motion.div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('todoItem.delete.dialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('todoItem.delete.dialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('todoItem.delete.dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('todoItem.delete.dialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

TodoItem.displayName = "TodoItem";

const EmptyState = memo(({ filter }: { filter: FilterOption }) => {
  const t = useTranslations('components.todoApp');
  
  const messages = {
    all: {
      title: t('emptyState.all.title'),
      description: t('emptyState.all.description'),
      icon: <ListTodo className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />,
    },
    active: {
      title: t('emptyState.active.title'),
      description: t('emptyState.active.description'),
      icon: (
        <CheckCheck className="w-8 h-8 text-emerald-300 dark:text-emerald-700" />
      ),
    },
    completed: {
      title: t('emptyState.completed.title'),
      description: t('emptyState.completed.description'),
      icon: (
        <CheckCircle2 className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
      ),
    },
  };

  return (
    <motion.div
      key={`empty-${filter}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={springAnimation}
      className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm py-12 space-y-2"
    >
      <motion.div
        className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {messages[filter].icon}
      </motion.div>
      <p className="font-medium">{messages[filter].title}</p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {messages[filter].description}
      </p>
    </motion.div>
  );
});

EmptyState.displayName = "EmptyState";

export const TodoApp = () => {
  const t = useTranslations('components.todoApp');
  const [todos, setTodos] = useLocalStorage<Todo[]>("todos", []);
  const [newTodo, setNewTodo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Wait to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleAddTodo = useCallback(async () => {
    if (newTodo.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        setTodos((currentTodos) => [
          ...currentTodos,
          {
            id: crypto.randomUUID(),
            text: newTodo.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        setNewTodo("");
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [newTodo, setTodos, isSubmitting]);

  const handleToggleTodo = useCallback(
    (id: string) => {
      setTodos((currentTodos) =>
        currentTodos.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
      );
    },
    [setTodos]
  );

  const handleDeleteTodo = useCallback(
    (id: string) => {
      setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
    },
    [setTodos]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddTodo();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTodo();
    }
  };

  const handleClearCompleted = () => {
    setTodos((currentTodos) => currentTodos.filter((todo) => !todo.completed));
  };

  const filteredTodos = useMemo(() => {
    let filtered = [...todos];

    // Apply filter
    if (filterOption === "active") {
      filtered = filtered.filter((todo) => !todo.completed);
    } else if (filterOption === "completed") {
      filtered = filtered.filter((todo) => todo.completed);
    }

    // Apply sort
    return filtered.sort((a, b) => {
      if (sortOption === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortOption === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        return a.text.localeCompare(b.text);
      }
    });
  }, [todos, sortOption, filterOption]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const percentComplete =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, percentComplete };
  }, [todos]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-100 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">{t('header.title')}</h1>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ArrowUpDown className="h-4 w-4" />
                        <span className="sr-only">{t('header.sort.button')}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setSortOption("newest")}
                        className={cn(
                          sortOption === "newest" &&
                            "bg-zinc-100 dark:bg-zinc-800"
                        )}
                      >
                        {t('header.sort.newest')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortOption("oldest")}
                        className={cn(
                          sortOption === "oldest" &&
                            "bg-zinc-100 dark:bg-zinc-800"
                        )}
                      >
                        {t('header.sort.oldest')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortOption("alphabetical")}
                        className={cn(
                          sortOption === "alphabetical" &&
                            "bg-zinc-100 dark:bg-zinc-800"
                        )}
                      >
                        {t('header.sort.alphabetical')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>{t('header.sort.button')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {todos.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('header.moreOptions.button')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={handleClearCompleted}
                          disabled={stats.completed === 0}
                        >
                          {t('header.moreOptions.clearCompleted')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent>{t('header.moreOptions.button')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={t('header.input.placeholder')}
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pr-20 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            aria-label={t('header.input.placeholder')}
            disabled={isSubmitting}
          />
          {newTodo.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setNewTodo("")}
              className="absolute right-12 top-1/2 -translate-y-1/2 h-6 w-6"
              aria-label={t('header.input.clearButton')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="submit"
            disabled={!newTodo.trim() || isSubmitting}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('header.input.addButton')}
          </Button>
        </form>
      </header>

      {todos.length > 0 && (
        <div className="border-b border-zinc-100 dark:border-zinc-800 px-2 py-2">
          <div className="flex items-center justify-between">
            <Tabs
              value={filterOption}
              onValueChange={(value) => setFilterOption(value as FilterOption)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all" className="text-xs">
                  {t('filters.all', { count: stats.total })}
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs">
                  {t('filters.active', { count: stats.active })}
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">
                  {t('filters.completed', { count: stats.completed })}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {filteredTodos.length === 0 ? (
          <EmptyState filter={filterOption} />
        ) : (
          <motion.div
            layout
            className="divide-y divide-zinc-100 dark:divide-zinc-800"
          >
            <AnimatePresence initial={false}>
              {filteredTodos.map((todo, index) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggleTodo}
                  onDelete={handleDeleteTodo}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {todos.length > 0 && (
        <footer className="border-t border-zinc-100 dark:border-zinc-800 p-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-sm font-normal">
                {t('footer.stats.total', { count: stats.total })}
              </Badge>
              <Badge variant="outline" className="rounded-sm font-normal">
                {t('footer.stats.completed', { count: stats.completed })}
              </Badge>
            </div>

            <div>
              {stats.percentComplete > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${stats.percentComplete}%` }}
                    />
                  </div>
                  <span>{stats.percentComplete}%</span>
                </div>
              )}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
