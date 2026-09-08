export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'meteorologist' | 'disaster_manager' | 'coastal_official' | 'researcher' | 'public';
  organization?: string;
  createdAt: string;
  savedCyclones: string[];
  alertSubscribedBasins: string[];
  preferences: {
    windUnit: 'kmh' | 'kt' | 'ms';
    pressureUnit: 'hpa' | 'mbar';
    defaultChannel: string;
  };
}

export const authService = {
  async getMe(): Promise<UserProfile | null> {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        return data.user || null;
      }
      return null;
    } catch {
      return null;
    }
  },

  async login(email: string, password: string): Promise<{ user: UserProfile }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    return data;
  },

  async signup(params: {
    name: string;
    email: string;
    password: string;
    role?: UserProfile['role'];
    organization?: string;
  }): Promise<{ user: UserProfile }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Signup failed.');
    }

    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
  },

  async toggleSavedCyclone(cycloneName: string): Promise<string[]> {
    const res = await fetch('/api/user/saved-cyclones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({ cycloneName }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update saved cyclone');
    return data.savedCyclones || [];
  },
};
