import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import GrunderwerbsteuerRechner from './GrunderwerbsteuerRechner.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GrunderwerbsteuerRechner />
  </StrictMode>
);
