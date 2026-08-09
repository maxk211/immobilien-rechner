import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import VermieterSoftwareLanding from './VermieterSoftwareLanding.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VermieterSoftwareLanding />
  </StrictMode>
);
