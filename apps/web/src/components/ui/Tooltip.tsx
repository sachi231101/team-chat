import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!visible || !triggerRef.current) return;

    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 8;
      let top = rect.top;
      let left = rect.left;
      if (side === 'right') {
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
      } else if (side === 'left') {
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
      } else if (side === 'bottom') {
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
      } else {
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
      }
      setCoords({ top, left });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [visible, side]);

  const transform =
    side === 'right'
      ? 'translateY(-50%)'
      : side === 'left'
        ? 'translate(-100%, -50%)'
        : side === 'bottom'
          ? 'translateX(-50%)'
          : 'translate(-50%, -100%)';

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[200] whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[11px] font-medium text-slate-100 shadow-lg ring-1 ring-slate-800 animate-in fade-in zoom-in-95"
            style={{ top: coords.top, left: coords.left, transform }}
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
};
