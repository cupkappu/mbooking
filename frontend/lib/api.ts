// API请求通过 Next.js 代理到后端
// 所有请求自动添加 /api/v1 前缀，与后端路由匹配

import { getSession } from 'next-auth/react';

interface ApiClientOptions {
  addAuthHeader?: boolean;
}

class ApiClient {
  private getHeaders(options?: ApiClientOptions): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    return headers;
  }

  private async getAuthHeader(): Promise<string | undefined> {
    if (typeof window === 'undefined') {
      return undefined;
    }

    try {
      const nextAuthToken = localStorage.getItem('next-auth.session-token');
      const accessToken = localStorage.getItem('accessToken');

      if (accessToken) {
        return `Bearer ${accessToken}`;
      }

      const session = await getSession();
      if (session?.accessToken) {
        return `Bearer ${session.accessToken}`;
      }
    } catch (error) {
      // Silently handle errors
    }
    
    return undefined;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 自动添加 /api/v1 前缀
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `/api/v1/${path}`;
    
    // 获取认证头
    const authHeader = await this.getAuthHeader();
    
    const headers: HeadersInit = {
      ...this.getHeaders(),
      ...options.headers,
    };
    
    if (authHeader) {
      (headers as Record<string, string>)['Authorization'] = authHeader;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      
      // 如果是 401 错误，提供更清晰的错误信息
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, body: object): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: object): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
