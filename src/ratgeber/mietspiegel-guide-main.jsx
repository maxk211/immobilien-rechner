import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import MietspiegelGuide from './MietspiegelGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MietspiegelGuide />
  </StrictMode>
);
