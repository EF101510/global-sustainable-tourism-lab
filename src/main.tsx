import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initFontSize } from './components/FontSizeControl';
import './index.css';

initFontSize();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
