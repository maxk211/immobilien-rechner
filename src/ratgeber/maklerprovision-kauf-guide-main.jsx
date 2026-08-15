import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import MaklerprovisionKaufGuide from './MaklerprovisionKaufGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MaklerprovisionKaufGuide />
  </StrictMode>
);
