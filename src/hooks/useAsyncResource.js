import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/** Load on focus and retry; ignore responses from an obsolete request or route.
 * @template T
 * @param {() => Promise<T>} loader
 */
export default function useAsyncResource(loader) {
  const [state, setState] = useState({ source: loader, data: /** @type {T | null} */ (null), loading: true, error: null });
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const current = ++generation.current;
    setState((previous) => ({ source: loader, data: previous.source === loader ? previous.data : null, loading: true, error: null }));
    try {
      const data = await loader();
      if (current === generation.current) setState({ source: loader, data, loading: false, error: null });
      return data;
    } catch (error) {
      if (current === generation.current) setState((previous) => ({ ...previous, loading: false, error }));
      return null;
    }
  }, [loader]);

  useFocusEffect(useCallback(() => {
    void reload();
    return () => { generation.current += 1; };
  }, [reload]));

  // A route can render with new params before its focus effect starts loading.
  // Never expose data belonging to the preceding query/ID in that render.
  return state.source === loader ? { ...state, reload }
    : { data: null, loading: true, error: null, reload };
}
