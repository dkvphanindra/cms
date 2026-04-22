import { LoginResponse } from '../types';

const API_BASE = 'http://localhost:5000';

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

export const api = {
  login(username: string, password: string) {
    return fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ username, password }),
    }).then(parseResponse<LoginResponse>);
  },

  changePassword(token: string, oldPassword: string, newPassword: string) {
    return fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify({ oldPassword, newPassword }),
    }).then(parseResponse<{ message: string }>);
  },

  getMyProfile(token: string) {
    return fetch(`${API_BASE}/students/me`, {
      headers: buildHeaders(token, false),
    }).then(parseResponse);
  },

  updateMyProfile(token: string, data: Record<string, unknown>) {
    return fetch(`${API_BASE}/students/me`, {
      method: 'PATCH',
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }).then(parseResponse);
  },

  getDocumentTypes(token: string) {
    return fetch(`${API_BASE}/document-types`, {
      headers: buildHeaders(token, false),
    }).then(parseResponse);
  },

  getMyDocuments(token: string) {
    return fetch(`${API_BASE}/documents/me`, {
      headers: buildHeaders(token, false),
    }).then(parseResponse);
  },

  uploadDocument(token: string, formData: FormData) {
    return fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: buildHeaders(token, false),
      body: formData,
    }).then(parseResponse);
  },

  updateDocumentVisibility(token: string, id: string, visibility: 'SHARED' | 'PRIVATE') {
    return fetch(`${API_BASE}/documents/${id}/visibility/${visibility}`, {
      method: 'PATCH',
      headers: buildHeaders(token, false),
    }).then(parseResponse);
  },

  getMyCertifications(token: string) {
    return fetch(`${API_BASE}/certifications/me`, {
      headers: buildHeaders(token, false),
    }).then(parseResponse);
  },

  uploadCertification(token: string, formData: FormData) {
    return fetch(`${API_BASE}/certifications/upload`, {
      method: 'POST',
      headers: buildHeaders(token, false),
      body: formData,
    }).then(parseResponse);
  },

  updateCertificationVisibility(token: string, id: string, visibility: 'SHARED' | 'PRIVATE') {
    return fetch(`${API_BASE}/certifications/${id}/visibility/${visibility}`, {
      method: 'PATCH',
      headers: buildHeaders(token, false),
    }).then(parseResponse);
  },

  getStudents(token: string, query: string) {
    return fetch(`${API_BASE}/students${query}`, {
      headers: buildHeaders(token, false),
    }).then(parseResponse);
  },

  getStudentById(token: string, id: string) {
    return fetch(`${API_BASE}/students/${id}`, {
      headers: buildHeaders(token, false),
    }).then(parseResponse);
  },

  createStudent(token: string, payload: Record<string, unknown>) {
    return fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    }).then(parseResponse);
  },
};
