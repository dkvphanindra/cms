import { LoginResponse } from '../types';

const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api').replace(/\/+$/, '');

function buildHeaders(token?: string, isJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed';
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      // Ignore parse errors and use default message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, init);
    return parseResponse<T>(response);
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      throw new Error(`Unable to reach server. Check backend and API settings (API base: ${API_BASE}).`);
    }
    throw error;
  }
}

export const api = {
  login(username: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ username, password }),
    });
  },

  changePassword(token: string, oldPassword: string, newPassword: string) {
    return request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  getMyProfile(token: string) {
    return request('/students/me', {
      headers: buildHeaders(token, false),
    });
  },

  updateMyProfile(token: string, data: Record<string, unknown>) {
    return request('/students/me', {
      method: 'PATCH',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    });
  },

  getDocumentTypes(token: string) {
    return request('/document-types', {
      headers: buildHeaders(token, false),
    });
  },

  getMyDocuments(token: string) {
    return request('/documents/me', {
      headers: buildHeaders(token, false),
    });
  },

  uploadDocument(token: string, formData: FormData) {
    return request('/documents/upload', {
      method: 'POST',
      headers: buildHeaders(token, false),
      body: formData,
    });
  },

  updateDocumentVisibility(token: string, id: string, visibility: 'SHARED' | 'PRIVATE') {
    return request(`/documents/${id}/visibility/${visibility}`, {
      method: 'PATCH',
      headers: buildHeaders(token, false),
    });
  },

  getMyCertifications(token: string) {
    return request('/certifications/me', {
      headers: buildHeaders(token, false),
    });
  },

  uploadCertification(token: string, formData: FormData) {
    return request('/certifications/upload', {
      method: 'POST',
      headers: buildHeaders(token, false),
      body: formData,
    });
  },

  updateCertificationVisibility(token: string, id: string, visibility: 'SHARED' | 'PRIVATE') {
    return request(`/certifications/${id}/visibility/${visibility}`, {
      method: 'PATCH',
      headers: buildHeaders(token, false),
    });
  },

  getStudents(token: string, query: string) {
    return request(`/students${query}`, {
      headers: buildHeaders(token, false),
    });
  },

  getStudentById(token: string, id: string) {
    return request(`/students/${id}`, {
      headers: buildHeaders(token, false),
    });
  },

  createStudent(token: string, payload: Record<string, unknown>) {
    return request('/students', {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    });
  },
};
