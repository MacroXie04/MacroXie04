import { render, screen } from '@testing-library/react';
import App from './App';

test('renders CodeEditor component', () => {
  render(<App />);
  // Check that the app container renders
  const appContainer = document.querySelector('.App');
  expect(appContainer).toBeInTheDocument();
  
  // Check that CodeEditor renders with its title - be specific to title bar
  const titleBar = document.querySelector('.title-text');
  expect(titleBar).toBeInTheDocument();
  expect(titleBar.textContent).toBe('Hongzhe Xie');
});

test('renders VSCode-style interface', () => {
  render(<App />);
  // Check for VSCode-like elements
  const titleBar = document.querySelector('.title-bar');
  expect(titleBar).toBeInTheDocument();
  
  // Check for status bar
  const statusBar = document.querySelector('.status-bar');
  expect(statusBar).toBeInTheDocument();
});
