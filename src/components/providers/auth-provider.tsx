"use client";

import { AuthContext } from "@/hooks/use-auth";
import { mockUsers, getEmployeeDataForUser } from "@/lib/data";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("dayflowUser");
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        const fullUserData = getEmployeeDataForUser(parsedUser.id);
        setUser(fullUserData);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("dayflowUser");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    // In a real app, you'd also check the password hash
    if (foundUser) {
      const fullUserData = getEmployeeDataForUser(foundUser.id);
      if (fullUserData) {
        setUser(fullUserData);
        localStorage.setItem("dayflowUser", JSON.stringify(fullUserData));
        setLoading(false);
        return fullUserData;
      }
    }
    
    setLoading(false);
    return null;
  };

  const signup = async (name: string, email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        setLoading(false);
        return null; // User already exists
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: "Employee",
        avatarUrl: "https://picsum.photos/seed/newuser/100/100",
        employeeDetails: {
            employeeId: `EMP-${Date.now()}`,
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
    
    // In a real app, you would save this to your database
    mockUsers.push(newUser); 
    
    setUser(newUser);
    localStorage.setItem("dayflowUser", JSON.stringify(newUser));
    setLoading(false);
    return newUser;
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem("dayflowUser");
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
