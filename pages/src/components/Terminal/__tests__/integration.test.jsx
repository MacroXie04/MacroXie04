import { render, fireEvent, screen, within } from '@testing-library/react';
import Terminal from '../index';

function type(input, value) {
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

function promptTexts(container) {
  return Array.from(container.querySelectorAll('.t-prompt')).map((node) => node.textContent);
}

describe('Terminal UI integration', () => {
  beforeEach(() => localStorage.clear());

  test('typing a command renders its output', () => {
    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');
    type(input, 'echo integration-ok');
    expect(screen.getByText('integration-ok')).toBeInTheDocument();
  });

  test('opens ICP details with the official MIIT query link', () => {
    render(<Terminal />);
    const trigger = screen.getByRole('button', { name: '京ICP备2026040481号' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveClass('t-quick-btn');
    expect(trigger.querySelector('.t-icp-logo')).toHaveAttribute('src', 'test-file-stub');

    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'ICP Filing Information' });
    expect(within(dialog).getByText('京ICP备2026040481号')).toBeInTheDocument();
    expect(within(dialog).getByText('Filing Number')).toBeInTheDocument();
    expect(within(dialog).getByText('Query Website')).toBeInTheDocument();
    expect(within(dialog).getByText('MIIT ICP/IP Address/Domain Name Filing Management System')).toBeInTheDocument();

    const queryLink = within(dialog).getByRole('link', { name: '京ICP备2026040481号' });
    expect(queryLink).toHaveAttribute('href', 'https://beian.miit.gov.cn/');
    expect(queryLink).toHaveAttribute('target', '_blank');
    expect(within(dialog).queryByText('Visit the MIIT Query Website')).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close ICP filing information dialog' }));
    expect(screen.queryByRole('dialog', { name: 'ICP Filing Information' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  test('cd updates the working directory and pwd reflects it (setCwd flow)', () => {
    const { container } = render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');
    type(input, 'echo from-home');
    type(input, 'cd projects');
    type(input, 'pwd');
    expect(screen.getByText('/home/visitor/projects')).toBeInTheDocument();
    expect(localStorage.getItem('t-cwd')).toBe('/home/visitor/projects');
    expect(promptTexts(container)).toEqual([
      'visitor@hongzhe:~$',
      'visitor@hongzhe:~$',
      'visitor@hongzhe:~/projects$',
      'visitor@hongzhe:~/projects$',
    ]);
  });

  test('restores a persisted working directory in the prompt', () => {
    localStorage.setItem('t-cwd', '/home/visitor/resume');
    const { container } = render(<Terminal />);
    expect(promptTexts(container)).toEqual(['visitor@hongzhe:~/resume$']);
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
