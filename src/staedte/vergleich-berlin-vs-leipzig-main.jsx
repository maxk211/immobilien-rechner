import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import StaedtVergleichSeite from './StaedtVergleichSeite.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StaedtVergleichSeite slugA="berlin" slugB="leipzig" />
  </StrictMode>
);
