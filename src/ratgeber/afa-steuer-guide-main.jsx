import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import AfaSteuerGuide from './AfaSteuerGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AfaSteuerGuide />
  </StrictMode>
);
