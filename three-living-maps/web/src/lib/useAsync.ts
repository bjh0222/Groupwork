// 数据加载 hooks：统一 loading / error / retry，避免每个页面重复样板。
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fn()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: ApiError | Error) => { if (!cancelled) setError((e as ApiError).message || '加载失败'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, retry, setData };
}