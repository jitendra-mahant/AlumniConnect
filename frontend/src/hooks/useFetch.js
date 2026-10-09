import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../api/client';

/**
 * Loads data from an API path. Re-fetches when `path`/`params` change.
 * Returns { data, loading, error, reload, setData }.
 */
export default function useFetch(path, params, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const key = JSON.stringify([path, params]);
  const latest = useRef(0);

  const load = useCallback(async () => {
    if (!enabled || !path) return;
    const ticket = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(path, { params });
      if (ticket === latest.current) setData(res.data);
    } catch (e) {
      if (ticket === latest.current) setError(errorMessage(e));
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
