"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "./apiClient";

/**
 * ════════════════════════════════════════════════════════════════
 *  useApi — élimine définitivement les spinners qui restent collés
 * ════════════════════════════════════════════════════════════════
 *  Garantit que `loading` revient à `false` dans 100% des cas
 *  (succès, erreur, ou démontage du composant) grâce à un bloc
 *  try/catch/finally + un guard "isMounted".
 *
 *  Usage :
 *    const { call, loading, error, data } = useApi();
 *
 *    const handleCreate = () => call(
 *      () => api("/api/posts", { method: "POST", body: { text } }),
 *      { onSuccess: (post) => setPosts((p) => [post, ...p]) }
 *    );
 *
 *  Ou en mode "fire and forget" :
 *    await call(() => api("/api/notifications", { method: "PATCH" }));
 * ════════════════════════════════════════════════════════════════
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Guard contre les setState après unmount (évite les warnings + leaks)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const call = useCallback(async (asyncFn, opts = {}) => {
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    let result = null;
    try {
      result = await asyncFn();
      if (mountedRef.current) setData(result);
      opts.onSuccess?.(result);
      return result;
    } catch (e) {
      console.error("[useApi]", e);
      if (mountedRef.current) setError(e.message || "Erreur inconnue");
      opts.onError?.(e);
      if (opts.throwOnError) throw e;
      return null;
    } finally {
      // ⚡ GARANTI : peu importe ce qui s'est passé, le spinner s'éteint
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { call, loading, error, data, reset };
}

/**
 * useApiFetch — variante "fetch on mount" (équivalent useEffect + api).
 * Recharge automatiquement quand `deps` change.
 *
 *   const { data, loading, error, refetch } = useApiFetch("/api/posts");
 */
export function useApiFetch(path, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api(path);
      if (mountedRef.current) setData(result);
    } catch (e) {
      console.error("[useApiFetch]", path, e);
      if (mountedRef.current) setError(e.message || "Erreur inconnue");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: fetchData };
}
