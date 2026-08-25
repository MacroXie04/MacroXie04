import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchCMSPage } from './api';
import { BlockRenderer } from './BlockRenderer';
import ui from '@assets/data/ui.json';
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
        <p>{ui.cms.error}</p>
        <Link to="/">{ui.cms.back}</Link>
      </div>
    );
  }

  if (error === 'not_found' || !page) {
    return (
      <div className="cms-page cms-page-not-found">
        <h1>{ui.cms.notFoundTitle}</h1>
        <p>{ui.cms.notFound}</p>
        <Link to="/">{ui.cms.back}</Link>
      </div>
    );
  }

  return (
    <div className="cms-page">
      <BlockRenderer blocks={page.blocks} />
      <p className="cms-page-footer">
        <Link to="/">{ui.cms.footerBack}</Link>
      </p>
    </div>
  );
};
