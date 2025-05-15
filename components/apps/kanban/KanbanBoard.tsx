import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  KeyboardSensor,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { coordinateGetter } from "./multipleContainersKeyboardPreset";
import BoardColumn from "./BoardColumn";
import { useTranslations } from 'next-intl';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

const STORAGE_KEY = "focusbrew-kanban-data";

const KanbanBoard: React.FC = () => {
  const t = useTranslations('components.kanban');
  
  const initialColumns: KanbanColumn[] = [
    {
      id: "todo",
      title: t('board.columns.todo'),
      cards: [],
    },
    {
      id: "inprogress",
      title: t('board.columns.inprogress'),
      cards: [],
    },
    {
      id: "done",
      title: t('board.columns.done'),
      cards: [],
    },
  ];

  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load data from localStorage on component mount (client-side only)
  useEffect(() => {
    if (isClient) {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setColumns(parsedData);
        }
      } catch (error) {
        console.error("Failed to parse kanban data from localStorage:", error);
      }
    }
  }, [isClient]);

  // Save data to localStorage whenever columns change (client-side only)
  useEffect(() => {
    if (isClient && columns !== initialColumns) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
      } catch (error) {
        console.error("Failed to save kanban data to localStorage:", error);
      }
    }
  }, [columns, isClient]);

  // Add card handler
  const addCardToColumn = (
    columnId: string,
    title: string,
    description?: string
  ) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: [
                ...col.cards,
                {
                  id: Date.now().toString(),
                  title,
                  description,
                },
              ],
            }
          : col
      )
    );
  };

  // Delete card handler
  const deleteCardFromColumn = (columnId: string, cardId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) }
          : col
      )
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const activeContainer = findContainerOfCard(activeId.toString());
    const overContainer = findContainerOfCard(overId.toString());

    // If we're dropping a card over a column directly
    if (isColumn(overId.toString())) {
      if (activeContainer && overId) {
        moveCardToColumn(activeId.toString(), overId.toString());
      }
      return;
    }

    // If no container change, we don't need to do anything
    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    // Time to move the card to a new container
    if (activeContainer && overContainer) {
      moveCardToContainer(activeId.toString(), activeContainer, overContainer);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    if (active.id === over.id) return;

    // Find the containers
    const activeContainer = findContainerOfCard(active.id.toString());
    const overContainer = findContainerOfCard(over.id.toString());

    // If we're dropping a card over a column directly
    if (isColumn(over.id.toString())) {
      if (activeContainer && over.id) {
        moveCardToColumn(active.id.toString(), over.id.toString());
      }
      return;
    }

    // If we're in the same container, reorder the items
    if (activeContainer && overContainer && activeContainer === overContainer) {
      const activeIndex = findCardIndex(activeContainer, active.id.toString());
      const overIndex = findCardIndex(overContainer, over.id.toString());

      if (activeIndex !== -1 && overIndex !== -1) {
        const newColumns = [...columns];
        const columnIndex = newColumns.findIndex(
          (col) => col.id === activeContainer
        );

        if (columnIndex !== -1) {
          newColumns[columnIndex].cards = arrayMove(
            newColumns[columnIndex].cards,
            activeIndex,
            overIndex
          );
          setColumns(newColumns);
        }
      }
      return;
    }

    // If containers are different, move the card
    if (activeContainer && overContainer) {
      moveCardToContainer(active.id.toString(), activeContainer, overContainer);
    }
  };

  // Helper functions
  const findContainerOfCard = (cardId: string): string | undefined => {
    for (const column of columns) {
      if (column.id === cardId) return column.id;
      if (column.cards.some((card) => card.id === cardId)) {
        return column.id;
      }
    }
    return undefined;
  };

  const isColumn = (id: string): boolean => {
    return columns.some((column) => column.id === id);
  };

  const findCardIndex = (columnId: string, cardId: string): number => {
    const column = columns.find((col) => col.id === columnId);
    if (!column) return -1;
    return column.cards.findIndex((card) => card.id === cardId);
  };

  const moveCardToContainer = (
    cardId: string,
    sourceId: string,
    destinationId: string
  ) => {
    const sourceIndex = columns.findIndex((col) => col.id === sourceId);
    const destinationIndex = columns.findIndex(
      (col) => col.id === destinationId
    );

    if (sourceIndex === -1 || destinationIndex === -1) return;

    const cardIndex = columns[sourceIndex].cards.findIndex(
      (card) => card.id === cardId
    );
    if (cardIndex === -1) return;

    const newColumns = [...columns];
    const [movedCard] = newColumns[sourceIndex].cards.splice(cardIndex, 1);
    newColumns[destinationIndex].cards.push(movedCard);

    setColumns(newColumns);
  };

  const moveCardToColumn = (cardId: string, columnId: string) => {
    const sourceColumnId = findContainerOfCard(cardId);
    if (!sourceColumnId || sourceColumnId === columnId) return;

    moveCardToContainer(cardId, sourceColumnId, columnId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 w-full overflow-x-auto p-6 pb-8 h-full box-border">
        <SortableContext
          items={columns.map((col) => col.id)}
          strategy={verticalListSortingStrategy}
        >
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              addCard={addCardToColumn}
              deleteCard={deleteCardFromColumn}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};

export default KanbanBoard;
