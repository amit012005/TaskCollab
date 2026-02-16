const getAuthHeaders = () => {
  const token = localStorage.getItem('taskcollab_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const api = async (path, options = {}) => {
  const res = await fetch(path, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  const data = res.ok ? await res.json().catch(() => ({})) : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const auth = {
  login: (email, password) => api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (email, password, name) => api('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  me: () => api('/api/auth/me'),
};

export const boards = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api(`/api/boards${q ? `?${q}` : ''}`);
  },
  get: (id) => api(`/api/boards/${id}`),
  create: (body) => api('/api/boards', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api(`/api/boards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api(`/api/boards/${id}`, { method: 'DELETE' }),
};

export const lists = {
  create: (boardId, title) =>
    api('/api/boards/' + boardId + '/lists', { method: 'POST', body: JSON.stringify({ title }) }),
  update: (id, body) => api('/api/lists/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api('/api/lists/' + id, { method: 'DELETE' }),
};

export const tasks = {
  create: (listId, body) =>
    api('/api/lists/' + listId + '/tasks', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => api('/api/tasks/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => api('/api/tasks/' + id, { method: 'DELETE' }),
  move: (taskId, targetListId, newOrder) =>
    api('/api/tasks/' + taskId + '/move', {
      method: 'POST',
      body: JSON.stringify({ targetListId, newOrder }),
    }),
  assign: (taskId, userId) =>
    api('/api/tasks/' + taskId + '/assign', { method: 'POST', body: JSON.stringify({ userId }) }),
  unassign: (taskId, userId) =>
    api('/api/tasks/' + taskId + '/unassign', { method: 'POST', body: JSON.stringify({ userId }) }),
};

export const activities = {
  list: (boardId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api(`/api/boards/${boardId}/activities${q ? `?${q}` : ''}`);
  },
};

export const users = {
  search: (q) => api(`/api/users/search?q=${encodeURIComponent(q)}`),
};
