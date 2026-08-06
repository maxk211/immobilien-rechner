import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import GrunderwerbsteuerGuide from './GrunderwerbsteuerGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GrunderwerbsteuerGuide />
  </StrictMode>
);
