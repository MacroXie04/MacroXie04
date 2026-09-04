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

  test('profile links do not refocus the terminal input', () => {
    const { container } = render(<Terminal />);
    const settingsButton = screen.getByRole('button', { name: 'Settings' });
    settingsButton.focus();

    fireEvent.click(container.querySelector('.t-profile-links'));

    expect(settingsButton).toHaveFocus();
  });

  test('does not submit a command while an IME composition is active', () => {
    render(<Terminal />);
    const input = screen.getByLabelText('Terminal input');
    fireEvent.change(input, { target: { value: 'echo 你好' } });

    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229, isComposing: true });

    expect(input).toHaveValue('echo 你好');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('');
    expect(screen.getByText('你好')).toBeInTheDocument();
  });

  test('tracks the visual viewport while a software keyboard is open', () => {
    const originalVisualViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport');
    const listeners = {};
    const visualViewport = {
      height: 430,
      offsetTop: 12,
      scale: 1,
      addEventListener: jest.fn((event, callback) => { listeners[event] = callback; }),
      removeEventListener: jest.fn(),
    };
    let rendered;

    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: visualViewport,
    });

    try {
      rendered = render(<Terminal />);
      const root = rendered.container.querySelector('.t-root');
      expect(root.style.getPropertyValue('--t-viewport-height')).toBe('430px');
      expect(root.style.getPropertyValue('--t-viewport-offset-top')).toBe('12px');

      visualViewport.height = 390;
      visualViewport.offsetTop = 8;
      listeners.resize();

      expect(root.style.getPropertyValue('--t-viewport-height')).toBe('390px');
      expect(root.style.getPropertyValue('--t-viewport-offset-top')).toBe('8px');
      rendered.unmount();
      rendered = null;
      expect(visualViewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(visualViewport.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    } finally {
      rendered?.unmount();
      if (originalVisualViewport) {
        Object.defineProperty(window, 'visualViewport', originalVisualViewport);
      } else {
        delete window.visualViewport;
      }
    }
  });

  test('scrolls the focused input into view when the viewport resizes', () => {
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const scrollIntoView = jest.fn();

    HTMLElement.prototype.scrollIntoView = scrollIntoView;
    window.requestAnimationFrame = callback => {
      callback();
      return 1;
    };

    try {
      render(<Terminal />);
      const input = screen.getByLabelText('Terminal input');
      expect(input).toHaveFocus();
      expect(input).toHaveAttribute('enterkeyhint', 'send');
      scrollIntoView.mockClear();

      type(input, 'help');
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
      scrollIntoView.mockClear();

      fireEvent(window, new Event('resize'));

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      window.requestAnimationFrame = originalRequestAnimationFrame;
    }
  });
});
