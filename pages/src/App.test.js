import { render } from '@testing-library/react';
import App from './App';

test('renders CodeEditor component', () => {
  const { container } = render(<App />);
  // Check that the app container renders
  const appContainer = container.querySelector('.App');
  expect(appContainer).toBeInTheDocument();
  
  // Check that CodeEditor renders with its title - be specific to title bar
  const titleBar = container.querySelector('.title-text');
  expect(titleBar).toBeInTheDocument();
  expect(titleBar.textContent).toBe('Hongzhe Xie');
});

test('renders VSCode-style interface', () => {
  const { container } = render(<App />);
  // Check for VSCode-like elements
  const titleBar = container.querySelector('.title-bar');
  expect(titleBar).toBeInTheDocument();
  
  // Check for status bar
  const statusBar = container.querySelector('.status-bar');
  expect(statusBar).toBeInTheDocument();
});
