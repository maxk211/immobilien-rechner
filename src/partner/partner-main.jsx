import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import PartnerLanding from './PartnerLanding.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PartnerLanding />
  </StrictMode>
);
