import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { AppProvider } from './context/AppContext';
import { RelationsDrawerProvider } from './context/RelationsDrawerContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <RelationsDrawerProvider>
          <App />
        </RelationsDrawerProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
