
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


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);
  

  const login = async (email: string, pass: string): Promise<User | null> => {
    // This will be replaced with a real API call
    if (email === 'admin@dayflow.com' && pass === 'admin') {
      const adminUser: User = {
        id: 'user-1',
        name: 'Sarah Chen',
        email: 'admin@dayflow.com',
        role: 'Admin',
        avatarUrl: 'https://picsum.photos/seed/sarah/100/100',
      };
      setUser(adminUser);
      setStoredUser(adminUser);
      return adminUser;
    }
    if (email === 'user@dayflow.com' && pass === 'user') {
      const employeeUser: User = {
        id: 'user-2',
        name: 'Mike Rivera',
        email: 'user@dayflow.com',
        role: 'Employee',
        avatarUrl: 'https://picsum.photos/seed/mike/100/100',
      };
      setUser(employeeUser);
      setStoredUser(employeeUser);
      return employeeUser;
    }
    return null;
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
        setUser(newUser);
        setStoredUser(newUser);
        return newUser;
    } catch (error) {
        console.error("Signup error:", error);
        return null;
    }
  };

  const logout = () => {
    setUser(null);
    setStoredUser(null);
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
