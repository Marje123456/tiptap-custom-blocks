import React from 'react';
import { TiptapEditor } from './components/editor/TiptapEditor';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Editor de Bloques</h1>
        <p>Escribe / para ver los comandos disponibles</p>
      </header>
      <main className="app-main">
        <TiptapEditor />
      </main>
      <footer className="app-footer">
        <p>Demo de editor con bloques personalizados usando TipTap</p>
      </footer>
    </div>
  );
}

export default App;
