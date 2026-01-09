
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import process from 'process';
import App from './App';
import '@xujunhao2010/material_components/dist/mc.js';
import '@xujunhao2010/material_components/dist/mc.css';
import '../index.css'; // Correct path to index.css - Imported LAST to override library styles

// Polyfill Buffer and process for music-metadata-browser
window.Buffer = Buffer;
window.process = process;

createRoot(document.getElementById('root')!).render(
  <App />
);
