
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, ImageOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@/lib/types";

export function UserNav() {
  const { user: authUser, logout, getToken, refreshUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserType | null>(authUser);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFullUser = useCallback(async () => {
    if (!authUser?.id) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/employees/${authUser.id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch user details");
      const fullUser: UserType = await res.json();
      setCurrentUser(fullUser);
    } catch (error) {
      console.error("Failed to fetch full user for UserNav", error);
    }
  }, [authUser, getToken]);

  useEffect(() => {
    fetchFullUser();
  }, [fetchFullUser]);

  const handleRemovePhoto = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
        const token = getToken();
        const res = await fetch(`/api/employees/${currentUser.id}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ avatarUrl: null })
        });
        if (!res.ok) throw new Error("Failed to remove photo.");

        await refreshUser(); // This will re-fetch and update the auth context
        await fetchFullUser(); // Re-fetch for this component's state
        toast({
            title: "Profile Picture Removed",
        });

    } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
    } finally {
        setLoading(false);
    }
  }


  if (!currentUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} className="object-cover" />
            <AvatarFallback>{currentUser.name?.[0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/profile">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
           <DropdownMenuItem onClick={handleRemovePhoto} disabled={loading || !currentUser.avatarUrl}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageOff className="mr-2 h-4 w-4" />}
            <span>Remove Photo</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
