"use client";

import { AuthContext } from "@/hooks/use-auth";
import type { User, UserRole } from "@/lib/types";
import { mockEmployees, mockUsers } from "@/lib/data";
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
    const foundUser = mockEmployees.find((u) => u.email === email && u.password === pass);
    if (foundUser) {
      const { password, ...userToStore } = foundUser;
      setUser(userToStore);
      setStoredUser(userToStore);
      return userToStore;
    }
    return null;
  };

  const signup = async (name: string, email: string, pass: string, employeeId: string, role: UserRole): Promise<User | null> => {
    const existingUser = mockUsers.find((u) => u.email === email || u.employeeDetails?.employeeId === employeeId);
    if (existingUser) {
        return null;
    }
    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: role,
        avatarUrl: `https://picsum.photos/seed/${name.split(' ')[0]}/100/100`,
        employeeDetails: {
            employeeId: employeeId,
            department: "Unassigned",
            position: "New Hire",
            dateOfJoining: new Date().toISOString(),
            contactNumber: "",
            address: "",
            emergencyContact: {
                name: "",
                relationship: "",
                phone: ""
            }
        }
    };
    mockEmployees.push({ ...newUser, password: pass } as any);
    mockUsers.push(newUser);
    setUser(newUser);
    setStoredUser(newUser);
    return newUser;
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
