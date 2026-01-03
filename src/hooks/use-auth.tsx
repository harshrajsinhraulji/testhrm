
"use client";

import type { User, UserRole } from "@/lib/types";
import React, { createContext, useContext } from "react";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
  signup: (name: string, email: string, pass: string, employeeId: string, role: UserRole, department: string, position: string) => Promise<User | null>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
