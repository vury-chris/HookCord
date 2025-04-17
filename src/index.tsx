import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// Create root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

// Render app
root.render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(
      HashRouter,
      null,
      React.createElement(App)
    )
  )
);