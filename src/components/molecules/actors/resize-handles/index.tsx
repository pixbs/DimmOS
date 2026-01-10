"use client";
import { useRef } from "react";
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

  const handleMouseDown = (
    e: React.MouseEvent,
    direction: "right" | "bottom" | "corner",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget.parentElement as HTMLElement;
    const gridContainer = target.parentElement as HTMLElement;

    if (!gridContainer) return;

    // Get computed grid properties
    const gridStyles = window.getComputedStyle(gridContainer);
    const templateColumns = gridStyles.gridTemplateColumns.split(" ");
    const templateRows = gridStyles.gridTemplateRows.split(" ");

    const cellWidth = parseFloat(templateColumns[0]);
    const cellHeight = parseFloat(templateRows[0]);

    dragState.current = {
      isResizing: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startColumn: gridColumn,
      startRow: gridRow,
      cellWidth,
      cellHeight,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
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
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

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
  };

  const handleMouseUp = () => {
    dragState.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Resize bottom"
        tabIndex={0}
        className={`${styles.handle} ${styles.bottom}`}
        onMouseDown={(e) => handleMouseDown(e, "bottom")}
      />
      <button
        type="button"
        aria-label="Resize right"
        tabIndex={0}
        className={`${styles.handle} ${styles.right}`}
        onMouseDown={(e) => handleMouseDown(e, "right")}
      />
      <button
        type="button"
        aria-label="Resize corner"
        tabIndex={0}
        className={`${styles.handle} ${styles.corner}`}
        onMouseDown={(e) => handleMouseDown(e, "corner")}
      />
    </>
  );
}
