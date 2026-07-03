import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { bootLog } from './lib/bootLog';

bootLog('main.tsx loaded');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

bootLog('main.tsx render() returned');
