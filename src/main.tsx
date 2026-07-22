import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react';
import App from './App.tsx';
import './index.css';

// Using the relative path dynamically based on current origin
const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      uiPreferences={{ theme: THEME.DARK }}
    >
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
);
