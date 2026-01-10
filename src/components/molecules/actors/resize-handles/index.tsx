"use client";
import { useRef, useCallback, useState } from "react";
import styles from "./style.module.css";

interface ResizeHandlesProps {
  gridColumn: number;
  gridRow: number;
  onColumnChange: (newColumn: number) => void;
  onRowChange: (newRow: number) => void;
  keepAspectRatio?: boolean;
}

export default function ResizeHandles({
  gridColumn,
  gridRow,
  onColumnChange,
  onRowChange,
  keepAspectRatio = false,
}: ResizeHandlesProps) {
  const [activeHandle, setActiveHandle] = useState<"right" | "bottom" | "corner" | null>(null);
  const dragState = useRef<{
    isResizing: boolean;
    direction: "right" | "bottom" | "corner";
    startX: number;
    startY: number;
    startColumn: number;
    startRow: number;
    cellWidth: number;
    cellHeight: number;
  } | null>(null);

  const handleResize = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragState.current) return;

      const {
        direction,
        startX,
        startY,
        startColumn,
        startRow,
        cellWidth,
        cellHeight,
      } = dragState.current;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      if (keepAspectRatio) {
        // For aspect ratio lock, use the larger delta to resize both dimensions
        const columnDelta = Math.round(deltaX / cellWidth);
        const rowDelta = Math.round(deltaY / cellHeight);
        const maxDelta =
          Math.abs(columnDelta) > Math.abs(rowDelta) ? columnDelta : rowDelta;
        const newSize = Math.max(1, startColumn + maxDelta);
        onColumnChange(newSize);
        onRowChange(newSize);
      } else {
        if (direction === "right" || direction === "corner") {
          const columnDelta = Math.round(deltaX / cellWidth);
          const newColumn = Math.max(1, startColumn + columnDelta);
          onColumnChange(newColumn);
        }

        if (direction === "bottom" || direction === "corner") {
          const rowDelta = Math.round(deltaY / cellHeight);
          const newRow = Math.max(1, startRow + rowDelta);
          onRowChange(newRow);
        }
      }
    },
    [keepAspectRatio, onColumnChange, onRowChange],
  );

  const initDragState = (
    target: HTMLElement,
    clientX: number,
    clientY: number,
    direction: "right" | "bottom" | "corner",
  ) => {
    const gridContainer = target.parentElement?.parentElement as HTMLElement;

    if (!gridContainer) return false;

    // Get computed grid properties
    const gridStyles = window.getComputedStyle(gridContainer);
    const templateColumns = gridStyles.gridTemplateColumns.split(" ");
    const templateRows = gridStyles.gridTemplateRows.split(" ");

    const cellWidth = parseFloat(templateColumns[0]);
    const cellHeight = parseFloat(templateRows[0]);

    dragState.current = {
      isResizing: true,
      direction,
      startX: clientX,
      startY: clientY,
      startColumn: gridColumn,
      startRow: gridRow,
      cellWidth,
      cellHeight,
    };

    return true;
  };

  // Mouse event handlers
  const handleMouseDown = (
    e: React.MouseEvent,
    direction: "right" | "bottom" | "corner",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!initDragState(e.currentTarget as HTMLElement, e.clientX, e.clientY, direction)) {
      return;
    }

    setActiveHandle(direction);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleResize(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setActiveHandle(null);
    dragState.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Touch event handlers
  const handleTouchStart = (
    e: React.TouchEvent,
    direction: "right" | "bottom" | "corner",
  ) => {
    e.stopPropagation();

    const touch = e.touches[0];
    if (!touch) return;

    if (!initDragState(e.currentTarget as HTMLElement, touch.clientX, touch.clientY, direction)) {
      return;
    }
setActiveHandle(direction);
    
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while resizing
    const touch = e.touches[0];
    if (!touch) return;

    handleResize(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setActiveHandle(null);
    dragState.current = null;
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    document.removeEventListener("touchcancel", handleTouchEnd);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Resize bottom"
        tabIndex={0}
        className={`${styles.handle} ${styles.bottom} ${activeHandle === "bottom" ? styles.active : ""}`}
        onMouseDown={(e) => handleMouseDown(e, "bottom")}
        onTouchStart={(e) => handleTouchStart(e, "bottom")}
      />
      <button
        type="button"
        aria-label="Resize right"
        tabIndex={0}
        className={`${styles.handle} ${styles.right} ${activeHandle === "right" ? styles.active : ""}`}
        onMouseDown={(e) => handleMouseDown(e, "right")}
        onTouchStart={(e) => handleTouchStart(e, "right")}
      />
      <button
        type="button"
        aria-label="Resize corner"
        tabIndex={0}
        className={`${styles.handle} ${styles.corner} ${activeHandle === "corner" ? styles.active : ""}`}
        onMouseDown={(e) => handleMouseDown(e, "corner")}
        onTouchStart={(e) => handleTouchStart(e, "corner")}
      />
    </>
  );
}
