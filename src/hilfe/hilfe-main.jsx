import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import HilfeCenter from './HilfeCenter.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HilfeCenter />
  </StrictMode>
);
