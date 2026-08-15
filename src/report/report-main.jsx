import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import MietrenditeReport from './MietrenditeReport.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MietrenditeReport />
  </StrictMode>
);
