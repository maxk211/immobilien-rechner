import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import KaufnebenkostenRechner from './KaufnebenkostenRechner.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KaufnebenkostenRechner />
  </StrictMode>
);
