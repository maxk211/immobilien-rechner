import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import GrundsteuerreformGuide from './GrundsteuerreformGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GrundsteuerreformGuide />
  </StrictMode>
);
