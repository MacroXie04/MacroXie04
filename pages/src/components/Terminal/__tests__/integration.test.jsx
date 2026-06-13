import { render, fireEvent, screen } from '@testing-library/react';
import Terminal from '../index';

function type(input, value) {
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

describe('Terminal UI integration', () => {
  beforeEach(() => localStorage.clear());

  test('typing a command renders its output', () => {
    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');
    type(input, 'echo integration-ok');
    expect(screen.getByText('integration-ok')).toBeInTheDocument();
  });

  test('cd updates the working directory and pwd reflects it (setCwd flow)', () => {
    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');
    type(input, 'cd projects');
    type(input, 'pwd');
    expect(screen.getByText('/home/visitor/projects')).toBeInTheDocument();
    expect(localStorage.getItem('t-cwd')).toBe('/home/visitor/projects');
  });

  test('an unknown command suggests a correction', () => {
    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');
    type(input, 'helpp');
    expect(screen.getByText("Unknown command: 'helpp'. Did you mean 'help'?")).toBeInTheDocument();
  });

  test('clear wipes the rendered history', () => {
    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');
    type(input, 'echo before-clear');
    expect(screen.getByText('before-clear')).toBeInTheDocument();
    type(input, 'clear');
    expect(screen.queryByText('before-clear')).not.toBeInTheDocument();
  });
});
