'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function RouteLoader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname)
        return;
      setIsNavigating(true);
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return isNavigating ? (
    <div className="route-loader" role="status" aria-live="polite" aria-label="Loading page">
      <span className="loading-spinner" />
    </div>
  ) : null;
}

export function LoadingIndicator() {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-spinner" />
    </div>
  );
}
