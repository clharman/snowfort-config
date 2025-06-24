#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Dashboard } from './components/Dashboard.js';

function App() {
  return <Dashboard />;
}

render(<App />);