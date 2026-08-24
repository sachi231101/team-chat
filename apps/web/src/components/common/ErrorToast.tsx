import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useChatDataStore } from '../../stores';

/**
 * Global error toast that renders when useChatDataStore has an error.
 * Auto-dismisses after 5 seconds. The user can also dismiss manually.
 */
export const ErrorToast: React.FC = () => {
  const error = useChatDataStore((s) => s.error);
  const clearError = useChatDataStore((s) => s.clearError);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(clearError, 300); // Wait for fade-out
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-xl px-4 py-3 shadow-2xl shadow-black/60 border transition-all duration-300"
      style={{
        background: 'rgba(239,68,68,0.12)',
        borderColor: 'rgba(239,68,68,0.35)',
        backdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(8px)',
        pointerEvents: visible ? 'auto' : 'none',
        maxWidth: '480px',
        minWidth: '280px',
      }}
    >
      <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
      <span className="text-xs font-medium text-red-300 flex-1">{error}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(clearError, 300);
        }}
        className="ml-1 rounded-md p-0.5 hover:bg-red-500/20 transition-colors"
      >
        <X className="h-3.5 w-3.5 text-red-400" />
      </button>
    </div>
  );
};
