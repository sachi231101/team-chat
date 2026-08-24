import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const storedTheme = localStorage.getItem('team_chat_theme');
const initialTheme =
  storedTheme === 'light' || storedTheme === 'slate' || storedTheme === 'dark'
    ? storedTheme
    : 'dark';
document.documentElement.setAttribute('data-theme', initialTheme);
document.documentElement.style.colorScheme = initialTheme === 'light' ? 'light' : 'dark';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
