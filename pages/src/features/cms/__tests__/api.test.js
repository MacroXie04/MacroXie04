import { fetchCMSPage, normalizeCMSRoute } from '../api';

describe('normalizeCMSRoute', () => {
  test('normalizes valid routes', () => {
    expect(normalizeCMSRoute('/about')).toBe('/about');
    expect(normalizeCMSRoute('about/')).toBe('/about');
    expect(normalizeCMSRoute(' /a/b ')).toBe('/a/b');
  });

  test('falls back to root for empty or unsafe input', () => {
    expect(normalizeCMSRoute('')).toBe('/');
    expect(normalizeCMSRoute('/')).toBe('/');
    expect(normalizeCMSRoute('javascript:alert(1)')).toBe('/');
    expect(normalizeCMSRoute('//evil.com')).toBe('/');
    expect(normalizeCMSRoute('a\\b')).toBe('/');
    expect(normalizeCMSRoute('/bad segment')).toBe('/');
  });
});

describe('fetchCMSPage', () => {
  afterEach(() => {
    delete global.fetch;
  });

  test('requests the normalized page URL and returns JSON', async () => {
    const payload = { route: '/about', title: 'About', blocks: [] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const result = await fetchCMSPage('/about');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/cms/pages/about/',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
    expect(result).toEqual(payload);
  });

  test('adds preview query param when requested', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ blocks: [] }),
    });

    await fetchCMSPage('/draft', true);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/cms/pages/draft/?preview=true',
      expect.anything(),
    );
  });

  test('requests the root page URL for "/"', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ blocks: [] }),
    });

    await fetchCMSPage('/');

    expect(global.fetch).toHaveBeenCalledWith('/api/cms/pages/', expect.anything());
  });

  test('throws an error carrying the status on non-OK responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchCMSPage('/missing')).rejects.toMatchObject({ status: 404 });
  });
});
