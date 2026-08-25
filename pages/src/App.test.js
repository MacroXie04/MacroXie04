import { render } from '@testing-library/react';
import App from './App';

test('renders Terminal component', () => {
  const { container } = render(<App />);
  // Check that the app container renders
  const appContainer = container.querySelector('.App');
  expect(appContainer).toBeInTheDocument();

  // Check that Terminal renders
  const terminal = container.querySelector('.t-root');
  expect(terminal).toBeInTheDocument();
});

test('renders terminal-style interface', () => {
  const { container } = render(<App />);
  // Check for terminal title bar
  const titleBar = container.querySelector('.t-titlebar');
  expect(titleBar).toBeInTheDocument();

  // Check for terminal output area
  const output = container.querySelector('.t-output');
  expect(output).toBeInTheDocument();
});
