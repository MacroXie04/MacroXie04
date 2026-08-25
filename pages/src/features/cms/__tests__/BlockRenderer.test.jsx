import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BlockRenderer } from '../BlockRenderer';

const renderBlocks = (blocks) =>
  render(
    <MemoryRouter>
      <BlockRenderer blocks={blocks} />
    </MemoryRouter>,
  );

describe('BlockRenderer', () => {
  test('renders all supported block types', () => {
    renderBlocks([
      { block_type: 'hero', sort_order: 1, data: { heading: 'Hero Heading', subheading: 'Sub' } },
      { block_type: 'rich_text', sort_order: 2, data: { heading: 'Rich', body_html: '<p>rich body</p>' } },
      {
        block_type: 'image_text',
        sort_order: 3,
        data: { heading: 'Img', image_url: '/media/x.png', image_alt: 'pic', body_html: '<p>img body</p>' },
      },
      {
        block_type: 'link_list',
        sort_order: 4,
        data: {
          heading: 'Links',
          items: [
            { label: 'External', url: 'https://example.com', is_external: true },
            { label: 'Internal', url: '/about' },
          ],
        },
      },
      {
        block_type: 'faq_list',
        sort_order: 5,
        data: { heading: 'FAQ', items: [{ question: 'Q1?', answer_html: '<p>A1</p>' }] },
      },
      {
        block_type: 'table',
        sort_order: 6,
        data: { heading: 'Table', columns: ['Name'], rows: [['Row1'], { Name: 'Row2' }] },
      },
    ]);

    expect(screen.getByText('Hero Heading')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
    expect(screen.getByText('rich body')).toBeInTheDocument();
    expect(screen.getByAltText('pic')).toBeInTheDocument();
    expect(screen.getByText('img body')).toBeInTheDocument();
    expect(screen.getByText('External')).toHaveAttribute('target', '_blank');
    expect(screen.getByText('Internal')).toHaveAttribute('href', '/about');
    expect(screen.getByText('Q1?')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Row1')).toBeInTheDocument();
    expect(screen.getByText('Row2')).toBeInTheDocument();
  });

  test('skips unknown block types', () => {
    const { container } = renderBlocks([
      { block_type: 'mystery', sort_order: 1, data: {} },
    ]);
    expect(container.querySelector('section')).toBeNull();
  });

  test('blocks unsafe external link schemes', () => {
    renderBlocks([
      {
        block_type: 'link_list',
        sort_order: 1,
        data: { items: [{ label: 'Bad', url: 'javascript:alert(1)', is_external: true }] },
      },
    ]);
    expect(screen.getByText('Bad')).toHaveAttribute('href', '#');
  });

  test('renders nothing for empty input', () => {
    const { container } = renderBlocks(undefined);
    expect(container.querySelector('section')).toBeNull();
  });
});
