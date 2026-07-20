import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://gestiona2.evenor-tech.com';

const upsertMeta = (name, content, attribute = 'name') => {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    const isPublicHome = location.pathname === '/';
    document.title = isPublicHome
      ? 'Gestiona-2 | Gestion de proyectos y propuestas europeas'
      : 'Gestiona-2';

    upsertMeta('robots', isPublicHome ? 'index, follow' : 'noindex, nofollow');

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', isPublicHome ? `${SITE_URL}/` : `${SITE_URL}${location.pathname}`);
  }, [location.pathname]);

  return null;
};

export default SeoManager;
