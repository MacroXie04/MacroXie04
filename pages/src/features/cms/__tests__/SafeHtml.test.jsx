import { render } from '@testing-library/react';
import { SafeHtml } from '../SafeHtml';

describe('SafeHtml', () => {
  test('renders allowed HTML', () => {
    const { container } = render(<SafeHtml html="<p>hello <strong>world</strong></p>" />);
    expect(container.querySelector('strong')).toHaveTextContent('world');
  });

  test('strips script tags and event handlers', () => {
    const { container } = render(
      <SafeHtml html={'<p>safe</p><script>alert(1)</script><a href="#" onclick="evil()">x</a>'} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('a')).not.toHaveAttribute('onclick');
    expect(container.textContent).toContain('safe');
  });

  test('handles empty input', () => {
    const { container } = render(<SafeHtml html="" />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
