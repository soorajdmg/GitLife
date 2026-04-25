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
    const { silent, ...fetchOptions } = options;
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json();
        // Handle express-validator errors array
        const message = error.error || (error.errors && error.errors[0]?.msg) || 'Request failed';
        throw new Error(message);
      }
      return await response.json();
    } catch (error) {
      if (!silent) console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth methods
  async register(email, fullName, username, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, fullName, username, password }),
    });
  }

  async checkUsername(username) {
    return this.request(`/auth/check-username?username=${encodeURIComponent(username)}`, { silent: true });
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

  async googleCallback(code) {
    return this.request('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
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

  // Explore methods
  async getExploreFeed(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.type) params.append('type', options.type);
    if (options.search) params.append('search', options.search);
    const query = params.toString();
    return this.request(`/explore${query ? `?${query}` : ''}`);
  }

  async searchUsers(search = '', limit = 20) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit);
    return this.request(`/explore/users?${params.toString()}`);
  }

  async getSuggestedUsers(limit = 12) {
    return this.request(`/explore/suggested?limit=${limit}`);
  }

  async getFollowing() {
    return this.request('/explore/following');
  }

  async followUser(userId) {
    return this.request(`/explore/follow/${userId}`, { method: 'POST' });
  }

  async unfollowUser(userId) {
    return this.request(`/explore/follow/${userId}`, { method: 'DELETE' });
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

  // Messages methods
  async getConversations() {
    return this.request('/messages/conversations');
  }

  async getOrCreateConversation(userId) {
    return this.request('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getMessages(conversationId, { limit = 50, before } = {}) {
    const params = new URLSearchParams({ limit });
    if (before) params.append('before', before);
    return this.request(`/messages/conversations/${conversationId}/messages?${params}`);
  }

  async markConversationRead(conversationId) {
    return this.request(`/messages/conversations/${conversationId}/read`, { method: 'POST' });
  }

  async deleteConversation(conversationId) {
    return this.request(`/messages/conversations/${conversationId}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Export for backward compatibility with Firebase code
export const db = api;
