"use client";

import { AuthContext } from "@/hooks/use-auth";
import type { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { 
  useFirebase, 
  useUser, 
  setDocumentNonBlocking,
  useDoc,
  useMemoFirebase,
} from "@/firebase";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc } from 'firebase/firestore';


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { auth, firestore } = useFirebase();
  const { user: firebaseUser, isUserLoading } = useUser();
  const router = useRouter();

  const userDocRef = useMemoFirebase(
    () => (firestore && firebaseUser ? doc(firestore, 'employees', firebaseUser.uid) : null),
    [firestore, firebaseUser]
  );
  const { data: userRecord, isLoading: isUserRecordLoading } = useDoc<User>(userDocRef);

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isUserLoading && !isUserRecordLoading) {
      if (firebaseUser && userRecord) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userRecord.name,
          role: userRecord.role,
          avatarUrl: userRecord.avatarUrl,
          employeeDetails: userRecord.employeeDetails,
        });
      } else {
        setUser(null);
      }
    }
  }, [firebaseUser, userRecord, isUserLoading, isUserRecordLoading]);


  const login = async (email: string, pass: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (name: string, email: string, pass: string, employeeId: string): Promise<User | null> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser: User = {
            id: userCredential.user.uid,
            name,
            email,
            role: "Employee", // Default role for now
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

        if (firestore) {
          const userDoc = doc(firestore, 'employees', newUser.id);
          setDocumentNonBlocking(userDoc, newUser, {});
        }

        return newUser;
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
        console.error("Signup failed: Email already in use.");
        return null;
      }
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const value = {
    user,
    role: user?.role ?? null,
    loading: isUserLoading || isUserRecordLoading,
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
