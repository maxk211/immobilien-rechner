import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import RatgeberUebersicht from './RatgeberUebersicht.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RatgeberUebersicht />
  </StrictMode>
);
