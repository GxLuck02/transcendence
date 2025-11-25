/**
 * Authentication Service
 * Handles user authentication, token management, and API calls
 */

import type { User, UserStats, Match } from '../types';

interface UpdateProfileData {
  display_name?: string;
  email?: string;
  avatar?: File;
}

export class AuthService {
  private readonly baseURL: string = 'https://localhost:8443/api';
  public currentUser: User | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private hasTriggeredLogoutRedirect = false;

  constructor() {
    this.loadTokens();
  }

  private loadTokens(): void {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr) as User;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  private saveUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  public clearAuth(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUser = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.hasTriggeredLogoutRedirect = false;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && !!this.currentUser;
  }

  public handleUnauthorizedResponse(response: Response): void {
    if (response.status !== 401) {
      return;
    }

    this.clearAuth();

    if (!this.hasTriggeredLogoutRedirect) {
      this.hasTriggeredLogoutRedirect = true;
      window.location.replace('/login');
    }

    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  public async register(
    username: string,
    email: string,
    displayName: string,
    password: string,
    passwordConfirm: string
  ): Promise<User> {
    const response = await fetch(`${this.baseURL}/users/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        display_name: displayName,
        password,
        password_confirm: passwordConfirm,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error((Object.values(error)[0] as string) || 'Registration failed');
    }

    const data = (await response.json()) as { tokens: { access: string; refresh: string }; user: User };
    this.saveTokens(data.tokens.access, data.tokens.refresh);
    this.saveUser(data.user);

    return data.user;
  }

  public async login(username: string, password: string): Promise<User> {
    const response = await fetch(`${this.baseURL}/users/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = (await response.json()) as { tokens: { access: string; refresh: string }; user: User };
    this.saveTokens(data.tokens.access, data.tokens.refresh);
    this.saveUser(data.user);

    return data.user;
  }

  public async logout(): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }

    try {
      await fetch(`${this.baseURL}/users/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }

    this.clearAuth();
  }

  public async getCurrentUser(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    const response = await fetch(`${this.baseURL}/users/me/`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const user = (await response.json()) as User;
    this.saveUser(user);
    return user;
  }

  public async updateProfile(data: UpdateProfileData): Promise<User> {
    const formData = new FormData();

    if (data.display_name) formData.append('display_name', data.display_name);
    if (data.email) formData.append('email', data.email);
    if (data.avatar) formData.append('avatar', data.avatar);

    const response = await fetch(`${this.baseURL}/users/profile/`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData,
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error((Object.values(error)[0] as string) || 'Profile update failed');
    }

    const user = (await response.json()) as User;
    this.saveUser(user);
    return user;
  }

  public async getMatchHistory(limit: number = 20): Promise<Match[]> {
    const response = await fetch(`${this.baseURL}/pong/matches/history/?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      throw new Error('Failed to get match history');
    }

    return (await response.json()) as Match[];
  }

  public async getFriends(): Promise<User[]> {
    const response = await fetch(`${this.baseURL}/users/friends/`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      throw new Error('Failed to get friends list');
    }

    const friendships = (await response.json()) as Array<{ friend: User }>;
    return friendships.map((entry) => entry.friend);
  }

  public async addFriend(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/users/friends/${userId}/add/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add friend');
    }

    return await response.json();
  }

  public async removeFriend(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/users/friends/${userId}/remove/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove friend');
    }

    return await response.json();
  }

  public async getUserStats(userId?: number): Promise<UserStats> {
    const url = userId
      ? `${this.baseURL}/users/${userId}/stats/`
      : `${this.baseURL}/users/stats/`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      throw new Error('Failed to get user stats');
    }

    return (await response.json()) as UserStats;
  }

  public getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public async getBlockedUsers(): Promise<User[]> {
    const response = await fetch(`${this.baseURL}/users/blocked/`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      throw new Error('Failed to get blocked users');
    }

    const blocked = (await response.json()) as Array<{ blocked: User }>;
    return blocked.map((entry) => entry.blocked);
  }

  public async blockUser(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/users/block/${userId}/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to block user');
    }

    return await response.json();
  }

  public async unblockUser(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/users/unblock/${userId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    this.handleUnauthorizedResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unblock user');
    }

    return await response.json();
  }
}

// Create singleton instance
export const authService = new AuthService();
