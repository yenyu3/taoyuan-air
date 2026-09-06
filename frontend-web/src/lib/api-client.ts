const API_BASE = '/api';

export async function apiFetch(path: string, options: RequestInit = {}, isFormData = false): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: isFormData
      ? { ...options.headers }
      : { 'Content-Type': 'application/json', ...options.headers },
  });
}
