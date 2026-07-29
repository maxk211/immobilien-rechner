import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import MietrenditeRechner from './MietrenditeRechner.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MietrenditeRechner />
  </StrictMode>
);
