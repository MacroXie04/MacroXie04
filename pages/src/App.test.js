import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.location.hash = '#/';
});

afterEach(() => {
  window.location.hash = '';
});

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

test('renders a local 404 for unknown routes without making network requests', () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn();
  window.location.hash = '#/missing-page';

  try {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to terminal' })).toHaveAttribute('href', '#/');
    expect(global.fetch).not.toHaveBeenCalled();
  } finally {
    global.fetch = originalFetch;
  }
});
