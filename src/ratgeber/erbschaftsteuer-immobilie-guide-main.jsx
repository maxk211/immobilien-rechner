import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import ErbschaftsteuerImmobilieGuide from './ErbschaftsteuerImmobilieGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErbschaftsteuerImmobilieGuide />
  </StrictMode>
);
