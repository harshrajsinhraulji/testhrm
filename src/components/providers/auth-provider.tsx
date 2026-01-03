
"use client";

import { AuthContext } from "@/hooks/use-auth";
import type { User, UserRole } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

// Helper to get/set user from localStorage
const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const storedUser = localStorage.getItem("dayflow-user");
  return storedUser ? JSON.parse(storedUser) : null;
};

const setStoredUser = (user: User | null) => {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("dayflow-user", JSON.stringify(user));
  } else {
    localStorage.removeItem("dayflow-user");
  }
};

const getStoredToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("dayflow-token");
};

const setStoredToken = (token: string | null) => {
    if (typeof window === "undefined") return;
    if (token) {
        localStorage.setItem("dayflow-token", token);
    } else {
        localStorage.removeItem("dayflow-token");
    }
};


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();
    if (storedUser && storedToken) {
      // Here you might want to verify the token with a backend endpoint
      // For now, we'll trust it if it exists.
      setUser(storedUser);
    }
    setLoading(false);
  }, []);
  

  const login = async (email: string, pass: string): Promise<User | null> => {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
        });

        if (!response.ok) {
            return null;
        }

        const { user, token } = await response.json();
        setUser(user);
        setStoredUser(user);
        setStoredToken(token);
        return user;
    } catch (error) {
        console.error("Login error:", error);
        return null;
    }
  };

  const signup = async (name: string, email: string, pass: string, employeeId: string, role: UserRole): Promise<User | null> => {
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass, employeeId, role }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Signup failed');
        }

        const newUser: User = await response.json();
        // After signup, we don't have a token yet, so we should guide user to login.
        // For a better UX, the signup could also return a token. For now, we just prepare for login.
        // Or we can log them in directly. Let's try logging them in.
        return login(email, pass);

    } catch (error) {
        console.error("Signup error:", error);
        return null;
    }
  };

  const logout = () => {
    setUser(null);
    setStoredUser(null);
    setStoredToken(null);
    router.push("/login");
  };

  const value = {
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout,
    signup,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
