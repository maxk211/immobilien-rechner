import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import GebaeudemodernisierungGuide from './GebaeudemodernisierungGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GebaeudemodernisierungGuide />
  </StrictMode>
);
