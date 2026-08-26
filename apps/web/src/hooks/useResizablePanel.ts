import { useState, useEffect, useCallback, useRef } from 'react';

interface UseResizableOptions {
  storageKey?: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  direction: 'left' | 'right'; // 'right' for left-sidebar, 'left' for right-drawers
}

export function useResizablePanel({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
  direction,
}: UseResizableOptions) {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined' || !storageKey) return defaultWidth;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (Number.isFinite(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
    return defaultWidth;
  });

  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef<number>(0);
  const startWidthRef = useRef<number>(width);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startPosRef.current;
      const newWidth =
        direction === 'right'
          ? startWidthRef.current + delta
          : startWidthRef.current - delta;

      const clamped = Math.min(Math.max(newWidth, minWidth), maxWidth);
      setWidth(clamped);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, String(clamped));
        } catch {
          /* ignore */
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minWidth, maxWidth, storageKey]);

  return {
    width,
    isDragging,
    handleProps: {
      onMouseDown,
    },
  };
}
