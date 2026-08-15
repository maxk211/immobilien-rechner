import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import KautionAnlageGuide from './KautionAnlageGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KautionAnlageGuide />
  </StrictMode>
);
