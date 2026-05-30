import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function applyAuth(data) {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(payload) {
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return applyAuth(data);
  }

  async function signin(payload) {
    const data = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return applyAuth(data);
  }

  async function signinWithGoogle(credential) {
    const data = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });
    return applyAuth(data);
  }

  async function updateProfile(payload) {
    const data = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    setUser(data.user);
    return data.user;
  }

  function signout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  const value = useMemo(() => ({
    user,
    loading,
    signup,
    signin,
    signinWithGoogle,
    updateProfile,
    signout
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
