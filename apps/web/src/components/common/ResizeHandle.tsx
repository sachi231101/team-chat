import React from 'react';

interface ResizeHandleProps {
  direction?: 'left' | 'right';
  isDragging?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  direction = 'left',
  isDragging = false,
  onMouseDown,
  className = '',
}) => {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      tabIndex={0}
      onMouseDown={onMouseDown}
      className={`group absolute top-0 bottom-0 z-40 w-2.5 cursor-col-resize select-none flex items-center justify-center transition-colors ${
        direction === 'left' ? '-left-1.5' : '-right-1.5'
      } ${className}`}
      title="Drag to resize panel"
    >
      <div
        className={`h-full w-[2px] transition-all rounded-full ${
          isDragging
            ? 'bg-violet-500 w-[3px] shadow-[0_0_8px_rgba(139,92,246,0.6)]'
            : 'bg-transparent group-hover:bg-violet-400/60 group-hover:w-[3px]'
        }`}
      />
    </div>
  );
};
