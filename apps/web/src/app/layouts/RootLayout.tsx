import React from 'react';

export interface RootLayoutProps {
  children?: React.ReactNode;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 antialiased">
      {children}
    </div>
  );
};
