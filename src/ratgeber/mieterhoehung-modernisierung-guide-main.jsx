import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import MieterhoehungModernisierungGuide from './MieterhoehungModernisierungGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MieterhoehungModernisierungGuide />
  </StrictMode>
);
