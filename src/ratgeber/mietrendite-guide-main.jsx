import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import MietrenditeGuide from './MietrenditeGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MietrenditeGuide />
  </StrictMode>
);
