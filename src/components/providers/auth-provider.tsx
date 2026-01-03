
"use client";

import { AuthContext } from "@/hooks/use-auth";
import type { User, UserRole, Employee } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

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
      setUser(storedUser);
    }
    setLoading(false);
  }, []);
  

  const login = async (email: string, pass: string): Promise<User | null> => {
    // Hardcoded admin login for testing
    if (email === 'admin@dayflow.com' && pass === 'admin') {
      const adminAvatar = PlaceHolderImages.find(img => img.id === 'admin-avatar');
      const adminUser: User = {
        id: 'admin-user-static',
        name: 'Sarah Chen (Admin)',
        email: 'admin@dayflow.com',
        role: 'Admin',
        avatarUrl: adminAvatar?.imageUrl || 'https://placehold.co/100x100',
        employeeDetails: {
          id: '00000000-0000-0000-0000-000000000000', // Mock UUID for admin
          employeeId: 'DF-ADMIN',
          department: 'Management',
          position: 'System Administrator',
          dateOfJoining: '2022-01-01',
          contactNumber: '123-456-7890',
          address: '123 Admin Way, Tech City',
          emergencyContact: {
            name: 'Admin Support',
            relationship: 'Support',
            phone: '098-765-4321',
          },
        }
      };
      setUser(adminUser);
      setStoredUser(adminUser);
      setStoredToken('static-admin-token');
      return adminUser;
    }

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
        
        // The API now returns the correct User object shape with the employee DB UUID
        setUser(user);
        setStoredUser(user);
        setStoredToken(token);
        return user;
    } catch (error) {
        console.error("Login error:", error);
        return null;
    }
  };

  const signup = async (name: string, email: string, pass: string, employeeId: string, role: UserRole, department: string, position: string): Promise<User | null> => {
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass, employeeId, role, department, position }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Signup failed');
        }

        // After signup, log them in directly to get the full user object with JWT
        return login(email, pass);

    } catch (error: any) {
        console.error("Signup error:", error);
        throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setStoredUser(null);
    setStoredToken(null);
    router.push("/login");
  };

  const refreshUser = async () => {
    if (!user?.employeeDetails?.id) {
        console.error("Cannot refresh user without an ID.");
        return;
    }
    try {
        const res = await fetch(`/api/employees/${user.employeeDetails.id}`);
        if (!res.ok) {
            throw new Error("Failed to fetch updated user data.");
        }
        const updatedUser = await res.json();
        setUser(updatedUser);
        setStoredUser(updatedUser);
    } catch (error) {
        console.error("Error refreshing user:", error);
        // Optional: handle error, maybe log out user if session is invalid
    }
  };

  const value = {
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout,
    signup,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
