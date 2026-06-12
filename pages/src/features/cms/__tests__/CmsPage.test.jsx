import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CmsPage } from '../CmsPage';

const renderAt = (route) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <CmsPage />
    </MemoryRouter>,
  );

describe('CmsPage', () => {
  afterEach(() => {
    delete global.fetch;
  });

  test('fetches and renders the page for the current route', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          route: '/about',
          title: 'About Me',
          blocks: [{ block_type: 'hero', sort_order: 1, data: { heading: 'Hello' } }],
        }),
    });

    renderAt('/about');

    await waitFor(() => expect(screen.getByText('Hello')).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith('/api/cms/pages/about/', expect.anything());
    expect(document.title).toBe('About Me');
  });

  test('passes preview=true through from the query string', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ title: 'Draft', blocks: [] }),
    });

    renderAt('/draft?preview=true');

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cms/pages/draft/?preview=true',
        expect.anything(),
      ),
    );
  });

  test('shows the 404 view when the page is missing', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    renderAt('/missing');

    await waitFor(() => expect(screen.getByText('404')).toBeInTheDocument());
    expect(screen.getByText('Page not found.')).toBeInTheDocument();
  });

  test('shows the error view on server failures', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    renderAt('/broken');

    await waitFor(() =>
      expect(screen.getByText('Something went wrong loading this page.')).toBeInTheDocument(),
    );
  });
});
