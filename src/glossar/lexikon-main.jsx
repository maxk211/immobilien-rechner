import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import ImmobilienLexikon from './ImmobilienLexikon.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ImmobilienLexikon />
  </StrictMode>
);
