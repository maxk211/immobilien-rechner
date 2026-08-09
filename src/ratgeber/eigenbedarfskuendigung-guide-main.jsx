import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import EigenbedarfskuendigungGuide from './EigenbedarfskuendigungGuide.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EigenbedarfskuendigungGuide />
  </StrictMode>
);
