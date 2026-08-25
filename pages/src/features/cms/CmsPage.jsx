import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchCMSPage } from './api';
import { BlockRenderer } from './BlockRenderer';
import './cms.css';

export const CmsPage = () => {
  const location = useLocation();
  const route = location.pathname;
  const preview = new URLSearchParams(location.search).get('preview') === 'true';

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCMSPage(route, preview)
      .then((data) => {
        if (!cancelled) {
          setPage(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPage(null);
          setError(err.status === 404 ? 'not_found' : 'error');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [route, preview]);

  useEffect(() => {
    if (page?.title) {
      document.title = page.title;
    }
  }, [page?.title]);

  if (loading) {
    return <div className="cms-page-loading" />;
  }

  if (error === 'error') {
    return (
      <div className="cms-page cms-page-error">
        <p>Something went wrong loading this page.</p>
        <Link to="/">Back to terminal</Link>
      </div>
    );
  }

  if (error === 'not_found' || !page) {
    return (
      <div className="cms-page cms-page-not-found">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link to="/">Back to terminal</Link>
      </div>
    );
  }

  return (
    <div className="cms-page">
      <BlockRenderer blocks={page.blocks} />
      <p className="cms-page-footer">
        <Link to="/">← back to terminal</Link>
      </p>
    </div>
  );
};
