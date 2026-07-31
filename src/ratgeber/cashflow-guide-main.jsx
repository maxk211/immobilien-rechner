import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import CashflowGuide from './CashflowGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CashflowGuide />
  </StrictMode>
);
