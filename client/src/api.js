const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('admin_token');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se a API está online.');
  }

  if (res.status === 401) {
    const isAdmin = path.startsWith('/admin/');
    if (isAdmin) {
      localStorage.removeItem('admin_token');
    }
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || !contentType.includes('application/json')) {
    const message = data?.error || data?.message || `Servidor indisponível (HTTP ${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) =>
    request(path, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    }),
};
