import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// useApi — declarative data fetching
// ---------------------------------------------------------------------------

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches data on mount and whenever `deps` change.
 *
 * ```ts
 * const { data: programs, loading, error, refetch } = useApi(
 *   () => fetchPrograms({ status: 'active' }),
 *   [status],
 * );
 * ```
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the latest fetcher so the stable `refetch` always calls the
  // most recent version without needing it as a dependency.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcherRef.current()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    // Return a cleanup function that prevents state updates after unmount or
    // when deps change before the previous request finishes.
    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cleanup = execute();
    return cleanup;
  }, [execute]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch };
}

// ---------------------------------------------------------------------------
// useMutation — imperative mutation wrapper
// ---------------------------------------------------------------------------

export interface UseMutationResult<T, A extends unknown[]> {
  mutate: (...args: A) => Promise<T>;
  loading: boolean;
  error: string | null;
}

/**
 * Wraps an async mutation function with `loading` and `error` state.
 *
 * ```ts
 * const { mutate: doCreate, loading, error } = useMutation(createProgram);
 * await doCreate({ name: 'New Program', type: 'ASIC', owner: 'u1' });
 * ```
 */
export function useMutation<T, A extends unknown[]>(
  mutator: (...args: A) => Promise<T>,
): UseMutationResult<T, A> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a stable reference so consumers don't need to memoise `mutator`.
  const mutatorRef = useRef(mutator);
  mutatorRef.current = mutator;

  const mutate = useCallback(async (...args: A): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutatorRef.current(...args);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
