import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatLayout } from '../layouts/ChatLayout';
import { SsoBootstrapPage } from '../../features/auth/SsoBootstrapPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sso" element={<SsoBootstrapPage />} />
        <Route path="/" element={<ChatLayout />} />
        <Route path="/channels/:channelId" element={<ChatLayout />} />
        <Route path="/conversations/:conversationId" element={<ChatLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
