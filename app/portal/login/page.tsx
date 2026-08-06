"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export default function PortalLogin() {
  const router = useRouter();
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/portal/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        toast(`Welcome ${data.user.username}`, { type: "success" });
        if (data.user.userType === "STUDENT") {
          router.push(`/portal/student?id=${data.user.referenceId}`);
        } else {
          router.push(`/portal/parent?id=${data.user.referenceId}`);
        }
      } else {
        toast("Invalid credentials", { type: "error" });
      }
    } catch {
      toast("Login failed", { type: "error" });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary">Portal Access</CardTitle>
          <p className="text-sm text-text-secondary">Students and Parents login here</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label="Username / Admission No." 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
            <Input 
              label="Password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            <Button type="submit" variant="primary" className="w-full h-11 text-lg mt-4">
              Sign In
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-text-secondary">
            <p>Don&apos;t have an account? Please contact the school administration.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
