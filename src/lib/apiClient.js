"use client";
import { auth } from "./firebase";

const DEFAULT_TIMEOUT = 15000; // 15s — au-delà, l'utilisateur doit voir une erreur

/**
 * Wrapper fetch — JWT Token + timeout + auto-retry sur 401/403.
 *
 *   await api("/api/posts")
 *   await api("/api/posts", { method: "POST", body: { text: "Hi" } })
 *   await api("/api/posts", { timeout: 30000 })           // override timeout
 *   await api("/api/posts", { forceRefresh: true })       // force refresh token
 */
export async function api(path, options = {}) {
  const user = auth.currentUser;
  if (!user) {
    const e = new Error("Not signed in");
    e.status = 401;
    throw e;
  }

  // 1. Récupérer un ID Token (cache ou refresh)
  let token;
  try {
    token = await user.getIdToken(!!options.forceRefresh);
  } catch (e) {
    const err = new Error("Token indisponible : " + e.message);
    err.status = 401;
    throw err;
  }

  // 2. Setup timeout via AbortController — coupe net les requêtes zombies
  const controller = new AbortController();
  const timeoutMs = options.timeout || DEFAULT_TIMEOUT;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const isFormData = options.body instanceof FormData;

  let res, data;
  try {
    res = await fetch(path, {
      method: options.method || "GET",
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      body: isFormData
        ? options.body
        : options.body
        ? JSON.stringify(options.body)
        : undefined,
    });
    data = await res.json().catch(() => ({}));
  } catch (e) {
    if (e.name === "AbortError") {
      const err = new Error(`Délai dépassé (${timeoutMs / 1000}s). Vérifiez votre connexion.`);
      err.status = 408;
      throw err;
    }
    throw e;
  } finally {
    // ⚡ GARANTI : timer libéré dans tous les cas
    clearTimeout(timeoutId);
  }

  // 3. Auto-retry sur 401/403 avec token frais (claims juste posées)
  if ((res.status === 401 || res.status === 403) && !options.forceRefresh && !options._retried) {
    return api(path, { ...options, forceRefresh: true, _retried: true });
  }

  // 4. Erreur HTTP → throw avec status
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Force un refresh du token (utile après promotion en admin). */
export async function refreshIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
}
