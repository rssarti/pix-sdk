import { readFileSync } from 'node:fs'; import https from 'node:https'; import axios, { type AxiosInstance } from 'axios';
import type { HttpClientOptions } from './http-client.js';
export interface TlsHttpClientOptions extends HttpClientOptions { certPath?: string; keyPath?: string; caPath?: string; }
export class TlsHttpClient {
  private readonly client: AxiosInstance;
  constructor(options: TlsHttpClientOptions = {}) {
    const agentOptions: https.AgentOptions = {};
    if (options.certPath) agentOptions.cert = readFileSync(options.certPath);
    if (options.keyPath) agentOptions.key = readFileSync(options.keyPath);
    if (options.caPath) agentOptions.ca = readFileSync(options.caPath);
    this.client = axios.create({ baseURL: options.baseURL, timeout: options.timeout ?? 30000, headers: options.headers, httpsAgent: new https.Agent(agentOptions) });
  }
  async get<T>(url: string): Promise<T> { return (await this.client.get<T>(url)).data; }
  async post<T>(url: string, data?: unknown): Promise<T> { return (await this.client.post<T>(url, data)).data; }
  async put<T>(url: string, data?: unknown): Promise<T> { return (await this.client.put<T>(url, data)).data; }
  async patch<T>(url: string, data?: unknown): Promise<T> { return (await this.client.patch<T>(url, data)).data; }
}
