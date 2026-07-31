import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import StaedteVergleich from './StaedteVergleich.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StaedteVergleich />
  </StrictMode>
);
