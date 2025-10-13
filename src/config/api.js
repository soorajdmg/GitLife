// API client for MongoDB backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Request failed');
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth methods
  async register(email, username, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Branch methods
  async getBranches() {
    return this.request('/branches');
  }

  async getBranch(id) {
    return this.request(`/branches/${id}`);
  }

  async createBranch(branchData) {
    return this.request('/branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  }

  async updateBranch(id, branchData) {
    return this.request(`/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(branchData),
    });
  }

  async deleteBranch(id) {
    return this.request(`/branches/${id}`, {
      method: 'DELETE',
    });
  }

  // Decision methods
  async getDecisions(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const query = params.toString();
    return this.request(`/decisions${query ? `?${query}` : ''}`);
  }

  async getDecision(id) {
    return this.request(`/decisions/${id}`);
  }

  async getDecisionsByBranch(branchName) {
    return this.request(`/decisions/branch/${branchName}`);
  }

  async createDecision(decisionData) {
    return this.request('/decisions', {
      method: 'POST',
      body: JSON.stringify(decisionData),
    });
  }

  async deleteDecision(id) {
    return this.request(`/decisions/${id}`, {
      method: 'DELETE',
    });
  }

  async getDecisionCount() {
    const result = await this.request('/decisions/count/total');
    return result.count;
  }

  // Stats methods
  async getStats() {
    return this.request('/stats');
  }

  async incrementImpact(value) {
    return this.request('/stats/increment', {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  async resetStats() {
    return this.request('/stats/reset', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Export for backward compatibility with Firebase code
export const db = api;
