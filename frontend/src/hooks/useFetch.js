import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errorMessage } from '../api/client';

/**
 * Loads data from an API path. Re-fetches when `path`/`params` change.
 * Returns { data, loading, error, reload, setData }.
 */
export default function useFetch(path, params, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && path));
  const [error, setError] = useState('');
  const paramsKey = JSON.stringify(params ?? null);
  const latest = useRef(0);
  const controllerRef = useRef(null);

  const load = useCallback(async () => {
    if (!enabled || !path) {
      setLoading(false);
      return;
    }

    const ticket = ++latest.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError('');

    try {
      const res = await api.get(path, { params, signal: controller.signal });
      if (ticket !== latest.current) return;
      setData(res.data);
    } catch (e) {
      if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') {
        return;
      }
      if (ticket !== latest.current) return;
      setData(null);
      setError(errorMessage(e));
    } finally {
      if (ticket === latest.current) {
        setLoading(false);
      }
    }
  }, [enabled, paramsKey, path]);

  useEffect(() => {
    if (!enabled || !path) {
      setData(null);
      setLoading(false);
      setError('');
      return undefined;
    }

    load();

    return () => {
      controllerRef.current?.abort();
    };
  }, [load, enabled, path]);

  return { data, loading, error, reload: load, setData };
}
