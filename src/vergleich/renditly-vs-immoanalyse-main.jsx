import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import RenditlyVsImmoAnalyse from './RenditlyVsImmoAnalyse.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RenditlyVsImmoAnalyse />
  </StrictMode>
);
