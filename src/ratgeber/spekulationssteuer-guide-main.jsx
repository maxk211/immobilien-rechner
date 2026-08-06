import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import SpekulationssteuerGuide from './SpekulationssteuerGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SpekulationssteuerGuide />
  </StrictMode>
);
