import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import StadtSeite from './StadtSeite.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StadtSeite slug="frankfurt" />
  </StrictMode>
);
