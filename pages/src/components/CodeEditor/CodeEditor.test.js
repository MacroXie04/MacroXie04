import { render, screen, fireEvent } from '@testing-library/react';
import CodeEditor from './index';

describe('CodeEditor Component', () => {
  test('renders without crashing', () => {
    render(<CodeEditor />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('displays title bar', () => {
    render(<CodeEditor />);
    const titleBar = screen.getByText(/macro xie/i);
    expect(titleBar).toBeInTheDocument();
  });

  test('shows file explorer panel', () => {
    render(<CodeEditor />);
    // Check for Explorer heading
    expect(screen.getByText('EXPLORER')).toBeInTheDocument();
  });

  test('displays welcome tab by default', () => {
    render(<CodeEditor />);
    // Check if Welcome tab is visible
    const welcomeTab = screen.getByText(/welcome/i);
    expect(welcomeTab).toBeInTheDocument();
  });

  test('can toggle file explorer visibility', () => {
    render(<CodeEditor />);
    // Find and click the explorer toggle button
    const explorerToggle = screen.getByTitle(/toggle primary sidebar/i);
    
    fireEvent.click(explorerToggle);
    // Explorer should be hidden
    expect(screen.queryByText('EXPLORER')).not.toBeVisible();
    
    fireEvent.click(explorerToggle);
    // Explorer should be visible again
    expect(screen.getByText('EXPLORER')).toBeVisible();
  });
});
