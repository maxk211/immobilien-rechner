import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import UntervermietungGuide from './UntervermietungGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UntervermietungGuide />
  </StrictMode>
);
