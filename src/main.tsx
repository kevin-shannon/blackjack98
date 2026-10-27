import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/legacy.css';
import './styles/settings.css';
import './styles/basic-strategy.css';
import './styles/training.css';
import './styles/deviations.css';
import './styles/buttons.css';
import './styles/cards.css';
import './styles/wagers.css';
import './styles/dialogs.css';
import './styles/strategy-chart.css';
import './styles/running-count.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
