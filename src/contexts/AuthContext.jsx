import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`/api/auth/check?t=${Date.now()}`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate', 
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const data = await res.json();
        if (data.status === 'success' && data.user) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    try {
      const { db } = await import('../utils/db.js');
      await db.sync_outbox.clear();
    } catch (e) {
      console.error(e);
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const handleRefreshUser = async () => {
    try {
      const res = await fetch(`/api/auth/check?t=${Date.now()}`, { 
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache, no-store, must-revalidate', 
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Auth check failed: Expected JSON but got HTML.");
      }

      const data = await res.json();
      if (data.status === 'success') {
        setCurrentUser(data.user);
        return true;
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthChecking,
      handleLoginSuccess,
      handleLogout,
      handleRefreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);