import React, { memo, useState } from "react";
import { KanbanCard } from "./KanbanBoard";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useTranslations } from 'next-intl';

interface CarCardProps {
  card: KanbanCard;
  onDelete?: () => void;
}

const CarCard = memo(({ card, onDelete }: CarCardProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const t = useTranslations('components.kanban');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
    boxShadow: isDragging ? "0 4px 16px 0 rgba(0,0,0,0.10)" : undefined,
    position: "relative" as const,
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "bg-background rounded-lg border transition-colors duration-150 p-3 flex flex-col gap-1 group",
          isDragging
            ? "border-accent shadow-lg"
            : "border-border hover:border-border/80"
        )}
        tabIndex={0}
        role="article"
        aria-label={t('card.aria.taskTitle', { title: card.title })}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-base font-medium text-foreground flex-1 truncate"
            title={card.title}
          >
            {card.title}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 opacity-60 group-hover:opacity-100 transition-opacity"
            {...listeners}
            aria-label={t('card.aria.dragHandle')}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        {card.description && (
          <div
            className="text-sm text-muted-foreground mt-1 line-clamp-2"
            title={card.description}
          >
            {card.description}
          </div>
        )}
        {onDelete && (
          <div className="flex justify-end mt-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleDeleteClick}
              aria-label={t('card.aria.deleteTask')}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('card.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('card.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('card.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('card.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

CarCard.displayName = "CarCard";

export default CarCard;
