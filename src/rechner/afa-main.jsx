import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import AfaRechner from './AfaRechner.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AfaRechner />
  </StrictMode>
);
