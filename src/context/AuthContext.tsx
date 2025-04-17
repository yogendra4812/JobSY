import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  skills?: string[];
  experience?: Array<{ position: string; company: string; duration: string }>;
  education?: Array<{ degree: string; institution: string; year: string }>;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: { user_id: string; email: string }) => void;
  updateUser: (data: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('jobsy_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (data: { user_id: string; email: string }) => {
    const userData: User = { id: data.user_id, email: data.email };
    setUser(userData);
    localStorage.setItem('jobsy_user', JSON.stringify(userData));
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...data } : null;
      if (updated) localStorage.setItem('jobsy_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('jobsy_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
