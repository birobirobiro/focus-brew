"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Minus, Plus } from "lucide-react";
import { throttle } from "lodash";
import { useTranslations } from 'next-intl';

const MIN_WINDOW_SIZE = {
  width: 300,
  height: 200,
} as const;

// Constants for window boundaries
const MENU_BAR_HEIGHT = 28;
const DOCK_HEIGHT = 96; // Dock height + bottom margin
const WINDOW_PADDING = 8; // Small margin to avoid sticking to edges
const TOTAL_VERTICAL_PADDING = WINDOW_PADDING * 2; // Padding for all directions

type Position = { x: number; y: number };
type Size = { width: number; height: number };
type ResizeDirection = "right" | "bottom" | "corner" | null;

interface AppWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  zIndex: number;
  position: Position;
  size: Size;
  onUpdate: (position: Position, size: Size) => void;
}

interface WindowControlProps {
  variant: "close" | "minimize" | "maximize";
  onClick?: (e: React.MouseEvent) => void;
  label: string;
  icon?: React.ReactNode;
}

const WindowControl = ({
  variant,
  onClick,
  label,
  icon,
}: WindowControlProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const t = useTranslations('components.window.controls');

  const variantStyles = {
    close: {
      base: "bg-destructive/70",
      hover: "bg-destructive",
    },
    minimize: {
      base: "bg-amber-400 dark:bg-amber-500/70",
      hover: "bg-amber-500 dark:bg-amber-500",
    },
    maximize: {
      base: "bg-emerald-400 dark:bg-emerald-500/70",
      hover: "bg-emerald-500 dark:bg-emerald-500",
    },
  };

  return (
    <motion.div
      className={cn(
        "h-3 w-3 rounded-full flex items-center justify-center transition-all duration-150",
        isHovered ? variantStyles[variant].hover : variantStyles[variant].base,
        isHovered ? "shadow-inner" : ""
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
      aria-label={t(variant)}
    >
      {isHovered && icon && (
        <motion.span
          className="text-zinc-800/90 dark:text-zinc-200/90 flex items-center justify-center w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {icon}
        </motion.span>
      )}
    </motion.div>
  );
};

// Add keyboard shortcut handling
const useKeyboardShortcuts = (onClose: () => void) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "w") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
};

// Window snapping guide positions
const SNAP_THRESHOLD = 20;
const SHOW_SNAP_GUIDES = false; // Disabled - no visual guides
const ENABLE_SNAPPING = false; // Disabled - no snapping functionality
const RESTRICT_TO_SCREEN = false; // Disabled - allow windows to move freely

const useWindowSnapping = (initialSize: Size) => {
  const [snapGuides, setSnapGuides] = useState<{
    vertical: number | null;
    horizontal: number | null;
  }>({ vertical: null, horizontal: null });

  const checkSnapping = useCallback(
    (pos: Position) => {
      const guides = {
        vertical: null as number | null,
        horizontal: null as number | null,
      };

      // Early return if window is not available or snapping is disabled
      if (typeof window === "undefined" || !ENABLE_SNAPPING) return guides;

      // Snap to screen edges
      if (Math.abs(pos.x) < SNAP_THRESHOLD) guides.vertical = 0;
      if (Math.abs(pos.y) < SNAP_THRESHOLD) guides.horizontal = 0;

      // Snap to screen center
      const screenCenter = window.innerWidth / 2 - initialSize.width / 2;
      if (Math.abs(pos.x - screenCenter) < SNAP_THRESHOLD) {
        guides.vertical = screenCenter;
      }

      setSnapGuides(guides);
      return guides;
    },
    [initialSize.width]
  );

  return { snapGuides, checkSnapping };
};

// State for window management
interface WindowState {
  isMinimized: boolean;
  isMaximized: boolean;
}

// Update to add window controls for minimize and maximize
const WindowControlGroup = ({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized,
}: {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMaximized: boolean;
}) => {
  const t = useTranslations('components.window.controls');
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className="flex space-x-1.5 items-center"
      onMouseDown={handleMouseDown}
    >
      <WindowControl
        variant="close"
        label={t('close')}
        onClick={onClose}
        icon={<X size={10} />}
      />
      <WindowControl
        variant="minimize"
        label={t('minimize')}
        onClick={onMinimize}
        icon={<Minus size={10} />}
      />
      <WindowControl
        variant="maximize"
        label={t('maximize')}
        onClick={onMaximize}
        icon={
          isMaximized ? (
            <div className="h-[8px] w-[8px] border border-zinc-800/90 dark:border-zinc-200/90" />
          ) : (
            <Plus size={10} />
          )
        }
      />
    </div>
  );
};

// Add a utility function to handle both mouse and touch events
const getEventCoordinates = (
  e: React.MouseEvent | React.TouchEvent
): { clientX: number; clientY: number } => {
  if ("touches" in e) {
    return {
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY,
    };
  }
  return {
    clientX: e.clientX,
    clientY: e.clientY,
  };
};

export function AppWindow({
  id,
  title,
  children,
  onClose,
  onFocus,
  onMinimize,
  isMinimized,
  zIndex,
  position,
  size,
  onUpdate,
}: AppWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Add a function to validate window bounds
  const validateWindowBounds = useCallback((pos: Position, sz: Size) => {
    if (typeof window === "undefined") return { pos, sz };

    // Calculate screen boundaries with proper constraints
    const maxWidth = window.innerWidth - TOTAL_VERTICAL_PADDING;
    const maxHeight =
      window.innerHeight -
      MENU_BAR_HEIGHT -
      DOCK_HEIGHT -
      TOTAL_VERTICAL_PADDING;

    // Ensure the window size is within acceptable bounds
    const validatedSize = {
      width: Math.min(Math.max(sz.width, MIN_WINDOW_SIZE.width), maxWidth),
      height: Math.min(Math.max(sz.height, MIN_WINDOW_SIZE.height), maxHeight),
    };

    // Calculate minimum position to keep window in view (at least partially)
    const minX = WINDOW_PADDING;
    const minY = MENU_BAR_HEIGHT + WINDOW_PADDING;
    // Maximum position to keep window at least partially visible
    const maxX = Math.max(
      window.innerWidth - MIN_WINDOW_SIZE.width - WINDOW_PADDING,
      minX
    );
    const maxY = Math.max(
      window.innerHeight -
        DOCK_HEIGHT -
        MIN_WINDOW_SIZE.height -
        TOTAL_VERTICAL_PADDING,
      minY
    );

    // Ensure position keeps window at least partially visible
    let x = Math.min(Math.max(minX, pos.x), maxX);
    let y = Math.min(Math.max(minY, pos.y), maxY);

    // If window doesn't fit at the current position with the validated size,
    // adjust position to keep as much of the window visible as possible
    if (x + validatedSize.width > window.innerWidth - WINDOW_PADDING) {
      x = Math.max(
        minX,
        window.innerWidth - validatedSize.width - WINDOW_PADDING
      );
    }

    if (
      y + validatedSize.height >
      window.innerHeight - DOCK_HEIGHT - TOTAL_VERTICAL_PADDING
    ) {
      y = Math.max(
        minY,
        window.innerHeight -
          DOCK_HEIGHT -
          validatedSize.height -
          TOTAL_VERTICAL_PADDING
      );
    }

    const validatedPosition = { x, y };

    return { pos: validatedPosition, sz: validatedSize };
  }, []);

  // Memoize the initial position and size validation
  const initialValidation = useMemo(() => {
    const initialPos = {
      x: Math.max(WINDOW_PADDING, position.x),
      y: Math.max(MENU_BAR_HEIGHT + WINDOW_PADDING, position.y),
    };
    return validateWindowBounds(initialPos, size);
  }, [position, size, validateWindowBounds]);

  const [internalPosition, setInternalPosition] = useState<Position>(
    initialValidation.pos
  );
  const [internalSize, setInternalSize] = useState<Size>(initialValidation.sz);
  const [windowState, setWindowState] = useState<WindowState>({
    isMinimized: false,
    isMaximized: false,
  });

  // Keep refs updated synchronously
  const positionRef = useRef(internalPosition);
  const sizeRef = useRef(internalSize);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    positionRef.current = internalPosition;
  }, [internalPosition]);

  useEffect(() => {
    sizeRef.current = internalSize;
  }, [internalSize]);

  // Store previous state for maximize/restore
  const previousStateRef = useRef<{ position: Position; size: Size } | null>(
    null
  );

  // Safe update function to prevent recursive updates
  const safeUpdate = useCallback(
    (pos: Position, sz: Size) => {
      if (!isUpdatingRef.current) {
        isUpdatingRef.current = true;
        requestAnimationFrame(() => {
          onUpdate(pos, sz);
          isUpdatingRef.current = false;
        });
      }
    },
    [onUpdate]
  );

  // Update position and size setters to use validation
  const setValidatedPosition = useCallback(
    (pos: Position) => {
      const { pos: validPos } = validateWindowBounds(pos, sizeRef.current);
      setInternalPosition(validPos);
      positionRef.current = validPos;
    },
    [validateWindowBounds]
  );

  const setValidatedSize = useCallback(
    (sz: Size) => {
      const { sz: validSize } = validateWindowBounds(positionRef.current, sz);
      setInternalSize(validSize);
      sizeRef.current = validSize;
    },
    [validateWindowBounds]
  );

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Focus window when mounted
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (windowRef.current) {
        windowRef.current.focus();
        onFocus();
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []); // Only run on mount

  // Add keyboard shortcuts
  useKeyboardShortcuts(onClose);

  // Add window snapping
  const { snapGuides, checkSnapping } = useWindowSnapping(size);

  const handleFocus = useCallback(() => {
    onFocus();
  }, [onFocus]);

  // Update handleDragStart to handle both mouse and touch events
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ("button" in e && e.button === 2) return; // Ignore right-click

      const coords = getEventCoordinates(e);

      setIsDragging(true);
      setDragOffset({
        x: coords.clientX - internalPosition.x,
        y: coords.clientY - internalPosition.y,
      });
      onFocus();

      e.preventDefault();
      e.stopPropagation();
    },
    [internalPosition, onFocus]
  );

  // Add a separate resize handler
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, direction: ResizeDirection) => {
      if ("button" in e && e.button === 2) return; // Ignore right-click

      setIsResizing(true);
      setResizeDirection(direction);
      onFocus();

      e.preventDefault();
      e.stopPropagation();
    },
    [onFocus]
  );

  // Handle window maximize with improved state management
  const handleMaximize = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();

      // Use requestAnimationFrame for smoother state transition
      requestAnimationFrame(() => {
        if (!windowState.isMaximized) {
          // Save current state before maximizing
          previousStateRef.current = {
            position: positionRef.current,
            size: sizeRef.current,
          };

          if (typeof window !== "undefined") {
            // Calculate new maximized size with proper constraints
            const maxHeight =
              window.innerHeight -
              MENU_BAR_HEIGHT -
              DOCK_HEIGHT -
              TOTAL_VERTICAL_PADDING;
            const maxWidth = window.innerWidth - TOTAL_VERTICAL_PADDING;

            const newPosition = {
              x: WINDOW_PADDING,
              y: MENU_BAR_HEIGHT + WINDOW_PADDING,
            };

            const newSize = {
              width: maxWidth,
              height: maxHeight,
            };

            // Update with validated values for better safety
            setValidatedPosition(newPosition);
            setValidatedSize(newSize);
            safeUpdate(newPosition, newSize);
          }
        } else {
          // Restore previous state when unmaximizing
          if (previousStateRef.current) {
            const { position, size } = previousStateRef.current;

            // Validate window bounds before applying
            const { pos: validPos, sz: validSize } = validateWindowBounds(
              position,
              size
            );

            setValidatedPosition(validPos);
            setValidatedSize(validSize);
            safeUpdate(validPos, validSize);
            previousStateRef.current = null;
          }
        }

        // Toggle maximized state
        setWindowState((prev) => ({
          ...prev,
          isMaximized: !prev.isMaximized,
        }));
      });
    },
    [
      windowState.isMaximized,
      safeUpdate,
      setValidatedPosition,
      setValidatedSize,
      validateWindowBounds,
    ]
  );

  // Update mouse event handlers to work with document-level events
  useEffect(() => {
    // Use throttled functions with requestAnimationFrame for smoother updates
    const handleGlobalMouseMove = throttle((e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      requestAnimationFrame(() => {
        if (isDragging) {
          const newPos = {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
          };
          setValidatedPosition(newPos);
        } else if (isResizing && windowRef.current) {
          const rect = windowRef.current.getBoundingClientRect();
          let newSize = { ...sizeRef.current };

          switch (resizeDirection) {
            case "right":
              newSize = {
                width: Math.max(MIN_WINDOW_SIZE.width, e.clientX - rect.left),
                height: sizeRef.current.height,
              };
              break;
            case "bottom":
              newSize = {
                width: sizeRef.current.width,
                height: Math.max(MIN_WINDOW_SIZE.height, e.clientY - rect.top),
              };
              break;
            case "corner":
              newSize = {
                width: Math.max(MIN_WINDOW_SIZE.width, e.clientX - rect.left),
                height: Math.max(MIN_WINDOW_SIZE.height, e.clientY - rect.top),
              };
              break;
          }

          setValidatedSize(newSize);
        }
      });
    }, 10); // Small throttle value for smooth movement

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        safeUpdate(positionRef.current, sizeRef.current);
      } else if (isResizing) {
        setIsResizing(false);
        setResizeDirection(null);
        safeUpdate(positionRef.current, sizeRef.current);
      }
    };

    // Handle touch events as well
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // Create a synthesized mouse event
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true,
        cancelable: true,
        view: window,
      });

      handleGlobalMouseMove(mouseEvent);
    };

    const handleGlobalTouchEnd = () => {
      handleGlobalMouseUp(new MouseEvent("mouseup"));
    };

    if (isDragging || isResizing) {
      // Add mouse event listeners
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);

      // Add touch event listeners
      document.addEventListener("touchmove", handleGlobalTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleGlobalTouchEnd);
      document.addEventListener("touchcancel", handleGlobalTouchEnd);

      return () => {
        // Remove all event listeners on cleanup
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
        document.removeEventListener("touchmove", handleGlobalTouchMove);
        document.removeEventListener("touchend", handleGlobalTouchEnd);
        document.removeEventListener("touchcancel", handleGlobalTouchEnd);
      };
    }
  }, [
    isDragging,
    isResizing,
    dragOffset,
    resizeDirection,
    safeUpdate,
    setValidatedPosition,
    setValidatedSize,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Handle window minimize
  const handleMinimize = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      onMinimize();
    },
    [onMinimize]
  );

  // Double-click on header to maximize
  const handleHeaderDoubleClick = useCallback(() => {
    handleMaximize();
  }, [handleMaximize]);

  return (
    <>
      {/* Snap guides - only render when necessary */}
      <AnimatePresence mode="wait">
        {SHOW_SNAP_GUIDES && isDragging && snapGuides.vertical !== null && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.4, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 bottom-0 w-0.5 bg-blue-300/50 origin-center"
            style={{ left: snapGuides.vertical }}
          />
        )}
        {SHOW_SNAP_GUIDES && isDragging && snapGuides.horizontal !== null && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 0.4, scaleY: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 h-0.5 bg-blue-300/50 origin-center"
            style={{ top: snapGuides.horizontal }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            ref={windowRef}
            key={id}
            tabIndex={0}
            className="absolute shadow-lg overflow-hidden shadow-zinc-950/10 dark:shadow-zinc-950/20 outline-none"
            style={{
              width: internalSize.width,
              height: internalSize.height,
              zIndex,
              borderRadius: 8,
              position: "absolute",
              willChange: "transform, width, height",
              touchAction: "none",
              maxWidth: windowState.isMaximized
                ? `calc(100vw - ${TOTAL_VERTICAL_PADDING}px)`
                : "none",
              maxHeight: windowState.isMaximized
                ? `calc(100vh - ${
                    MENU_BAR_HEIGHT + DOCK_HEIGHT + TOTAL_VERTICAL_PADDING
                  }px)`
                : "none",
            }}
            initial={{ opacity: 0, scale: 0.95, x: position.x, y: position.y }}
            animate={{
              opacity: 1,
              scale: 1,
              x: internalPosition.x,
              y: internalPosition.y,
              transition: isDragging
                ? { type: "spring", damping: 50, stiffness: 500 }
                : { type: "spring", damping: 20, stiffness: 300 },
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              transition: { duration: 0.15 },
            }}
            onFocus={handleFocus}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-labelledby={`window-title-${id}`}
            role="dialog"
            aria-modal="true"
          >
            <Card className="flex flex-col h-full overflow-hidden outline-none ring-0 border-zinc-100/20 border dark:border-zinc-700/30">
              <CardHeader
                className={cn(
                  "p-0 space-y-0 select-none cursor-move flex flex-row items-center justify-between border-b border-zinc-100/20 dark:border-zinc-800/20 window-header",
                  isDragging && "cursor-grabbing"
                )}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                onDoubleClick={handleHeaderDoubleClick}
                data-testid="window-header"
              >
                <div className="flex-1 flex items-center justify-between px-3 py-1.5">
                  <WindowControlGroup
                    onClose={onClose}
                    onMinimize={handleMinimize}
                    onMaximize={handleMaximize}
                    isMaximized={windowState.isMaximized}
                  />

                  <div className="flex items-center space-x-2">
                    <h2
                      id={`window-title-${id}`}
                      className="text-sm font-medium text-center max-w-xs sm:max-w-md md:max-w-lg"
                    >
                      {title}
                    </h2>
                  </div>

                  <div className="invisible w-[58px]" />
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 overflow-hidden relative h-full">
                {children}
              </CardContent>

              {/* Resize handlers */}
              {!windowState.isMaximized && (
                <>
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onMouseDown={(e) => handleResizeStart(e, "right")}
                    onTouchStart={(e) => handleResizeStart(e, "right")}
                    onDoubleClick={(e) => e.stopPropagation()}
                    aria-label="Resize window"
                    role="button"
                    tabIndex={-1}
                  />
                  <div
                    className="absolute bottom-0 w-full h-1 cursor-s-resize"
                    onMouseDown={(e) => handleResizeStart(e, "bottom")}
                    onTouchStart={(e) => handleResizeStart(e, "bottom")}
                    onDoubleClick={(e) => e.stopPropagation()}
                    aria-label="Resize window height"
                    role="button"
                    tabIndex={-1}
                  />
                  <div
                    className="absolute right-0 h-full w-1 cursor-e-resize"
                    onMouseDown={(e) => handleResizeStart(e, "corner")}
                    onTouchStart={(e) => handleResizeStart(e, "corner")}
                    onDoubleClick={(e) => e.stopPropagation()}
                    aria-label="Resize window width"
                    role="button"
                    tabIndex={-1}
                  />
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
