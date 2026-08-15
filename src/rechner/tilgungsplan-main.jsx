import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import TilgungsplanRechner from './TilgungsplanRechner.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TilgungsplanRechner />
  </StrictMode>
);
