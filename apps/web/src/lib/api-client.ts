const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}, accessToken?: string) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as
    T | { message?: string | string[] } | null;

  if (!response.ok) {
    const errorBody = body as { message?: string | string[] } | null;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(', ')
      : errorBody?.message;
    throw new ApiError(message ?? 'Request failed', response.status);
  }

  return body as T;
}

export type User = {
  id: string;
  email: string;
};

export type KnowledgeBase = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type Document = {
  id: string;
  knowledgeBaseId: string;
  filename: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { chunks: number };
};

type AuthResponse = {
  accessToken: string;
  user: User;
};

export const apiClient = {
  register(email: string, password: string) {
    return request<AuthResponse>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  login(email: string, password: string) {
    return request<AuthResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  refresh() {
    return request<AuthResponse>('/v1/auth/refresh', { method: 'POST' });
  },

  logout() {
    return request<{ success: boolean }>('/v1/auth/logout', { method: 'POST' });
  },

  listKnowledgeBases(accessToken: string) {
    return request<KnowledgeBase[]>('/v1/knowledge-bases', {}, accessToken);
  },

  getKnowledgeBase(accessToken: string, id: string) {
    return request<KnowledgeBase>(`/v1/knowledge-bases/${id}`, {}, accessToken);
  },

  createKnowledgeBase(accessToken: string, name: string, description: string) {
    return request<KnowledgeBase>(
      '/v1/knowledge-bases',
      {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      },
      accessToken,
    );
  },

  deleteKnowledgeBase(accessToken: string, id: string) {
    return request<{ success: boolean }>(
      `/v1/knowledge-bases/${id}`,
      { method: 'DELETE' },
      accessToken,
    );
  },

  listDocuments(accessToken: string, knowledgeBaseId: string) {
    return request<Document[]>(`/v1/knowledge-bases/${knowledgeBaseId}/documents`, {}, accessToken);
  },

  uploadDocuments(accessToken: string, knowledgeBaseId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return request<Document[]>(
      `/v1/knowledge-bases/${knowledgeBaseId}/documents`,
      { method: 'POST', body: formData },
      accessToken,
    );
  },

  deleteDocument(accessToken: string, id: string) {
    return request<{ success: boolean }>(`/v1/documents/${id}`, { method: 'DELETE' }, accessToken);
  },
};
