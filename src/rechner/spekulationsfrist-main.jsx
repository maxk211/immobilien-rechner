import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import SpekulationsfristRechner from './SpekulationsfristRechner.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SpekulationsfristRechner />
  </StrictMode>
);
