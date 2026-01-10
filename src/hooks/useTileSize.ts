"use client";
import { useEffect, useRef, useCallback } from "react";

export default function useTileSize<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);

  const getTilePixels = useCallback(() => {
    const tileValue = getComputedStyle(document.documentElement)
      .getPropertyValue("--tile")
      .trim();

    const vwMatch = tileValue.match(/([\d.]+)vw/);
    if (vwMatch) {
      const vwValue = parseFloat(vwMatch[1]);
      return (vwValue * window.innerWidth) / 100;
    }
    return 75; // fallback
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateClasses = () => {
      const tilePixels = getTilePixels();
      const widthTiles = Math.round(container.offsetWidth / tilePixels);
      const heightTiles = Math.round(container.offsetHeight / tilePixels);

      // Remove existing tile classes
      const classesToRemove = [...container.classList].filter((cls) =>
        cls.match(/^[wh]-\d+$/),
      );
      for (const cls of classesToRemove) {
        container.classList.remove(cls);
      }

      // Add new tile classes
      container.classList.add(`w-${widthTiles}`, `h-${heightTiles}`);
    };

    const resizeObserver = new ResizeObserver(updateClasses);
    resizeObserver.observe(container);

    window.addEventListener("resize", updateClasses);
    updateClasses();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateClasses);
    };
  }, [getTilePixels]);

  return containerRef;
}
