const localHosts = new Set(['localhost', '127.0.0.1']);
const runtimeHost =
  typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : '';
const defaultApiBaseUrl = localHosts.has(runtimeHost)
  ? 'http://localhost:5000'
  : 'https://bruno-backend-ku0v.onrender.com';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? defaultApiBaseUrl;
const FALLBACK_API_BASE_URL = API_BASE_URL.includes('localhost')
  ? API_BASE_URL.replace('localhost', '127.0.0.1')
  : null;

type ApiError = { message?: string };

const ABSOLUTE_URL_PATTERN = /^(https?:)?\/\//i;

export function resolveApiFileUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return '';
  const value = pathOrUrl.trim();
  if (!value) return '';

  if (ABSOLUTE_URL_PATTERN.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }

  const base = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${base}${normalizedPath}`;
}

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function request<TResponse>(path: string, method: string, body?: unknown): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    if (FALLBACK_API_BASE_URL && FALLBACK_API_BASE_URL !== API_BASE_URL) {
      try {
        response = await fetch(`${FALLBACK_API_BASE_URL}${path}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      } catch {
        throw new Error(
          `Cannot reach backend at ${API_BASE_URL} or ${FALLBACK_API_BASE_URL}. Make sure server is running.`,
        );
      }
    } else {
      throw new Error(`Cannot reach backend at ${API_BASE_URL}. Make sure server is running.`);
    }
  }

  const data = (await parseJson(response)) as TResponse & ApiError;

  if (!response.ok) {
    throw new Error(data.message || `${method} ${path} failed`);
  }

  return data;
}

async function requestForm<TResponse>(path: string, body: FormData): Promise<TResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      body,
    });
  } catch {
    if (FALLBACK_API_BASE_URL && FALLBACK_API_BASE_URL !== API_BASE_URL) {
      try {
        response = await fetch(`${FALLBACK_API_BASE_URL}${path}`, {
          method: 'POST',
          body,
        });
      } catch {
        throw new Error(
          `Cannot reach backend at ${API_BASE_URL} or ${FALLBACK_API_BASE_URL}. Make sure server is running.`,
        );
      }
    } else {
      throw new Error(`Cannot reach backend at ${API_BASE_URL}. Make sure server is running.`);
    }
  }

  const data = (await parseJson(response)) as TResponse & ApiError;

  if (!response.ok) {
    throw new Error(data.message || `POST ${path} failed`);
  }

  return data;
}

export async function getJson<TResponse = unknown>(path: string) {
  return request<TResponse>(path, 'GET');
}

export async function postJson<TResponse = unknown>(path: string, body: unknown) {
  return request<TResponse>(path, 'POST', body);
}

export async function putJson<TResponse = unknown>(path: string, body: unknown) {
  return request<TResponse>(path, 'PUT', body);
}

export async function deleteJson<TResponse = unknown>(path: string) {
  return request<TResponse>(path, 'DELETE');
}

export async function uploadFile<TResponse = { url: string; filename: string }>(path: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return requestForm<TResponse>(path, form);
}
