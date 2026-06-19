import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
export interface HttpClientOptions { baseURL?: string; timeout?: number; headers?: Record<string, string>; }
export class HttpClient {
  private readonly client: AxiosInstance;
  constructor(options: HttpClientOptions = {}) { this.client = axios.create({ baseURL: options.baseURL, timeout: options.timeout ?? 30000, headers: options.headers }); }
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> { return (await this.client.get<T>(url, config)).data; }
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> { return (await this.client.post<T>(url, data, config)).data; }
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> { return (await this.client.put<T>(url, data, config)).data; }
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> { return (await this.client.patch<T>(url, data, config)).data; }
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> { return (await this.client.delete<T>(url, config)).data; }
}
