import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/legacy.css';
import './styles/settings.css';
import './styles/basic-strategy.css';
import './styles/training.css';
import './styles/deviations.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
