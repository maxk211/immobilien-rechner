import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import NebenkostenGuide from './NebenkostenGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NebenkostenGuide />
  </StrictMode>
);
