"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  ShieldAlert,
  KeyRound,
  Mail,
  UserCheck,
  Lock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

type AuthState =
  | "login"
  | "forgot"
  | "reset"
  | "otp"
  | "email-verify"
  | "2fa"
  | "locked"
  | "changed"
  | "expired"
  | "unauthorized"
  | "denied";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<AuthState>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (state === "login") {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password }),
        });

        const data = await res.json();
        setIsSubmitting(false);

        if (!res.ok) {
          toast("Authentication Failed", { description: data.message || "Invalid credentials.", type: "error" });
          return;
        }

        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token); // Save JWT
        toast("Credentials Approved", { description: `Welcome back, ${data.user.fullName}!`, type: "success" });
        // Force a hard navigation to reload layout with the new token so the interceptor picks it up
        window.location.href = "/dashboard";
      } catch {
        setIsSubmitting(false);
        toast("Connection Refused", { description: "Make sure the NestJS backend engine is running on port 8000.", type: "error" });
      }
    } else {
      setTimeout(() => {
        setIsSubmitting(false);
        router.push("/dashboard");
      }, 500);
    }
  };

  return (
    <AuthLayout>
      {/* State Switcher Simulator Controls at Top */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-card border border-border flex flex-wrap gap-1.5 justify-center mb-6">
        <span className="text-[10px] font-bold text-text-secondary uppercase w-full text-center block mb-1">
          Auth Simulator Screen Controls
        </span>
        {(
          [
            { id: "login", label: "Login" },
            { id: "forgot", label: "Forgot" },
            { id: "reset", label: "Reset" },
            { id: "otp", label: "OTP" },
            { id: "2fa", label: "2FA" },
            { id: "email-verify", label: "Verify Email" },
            { id: "locked", label: "Locked" },
            { id: "changed", label: "Changed" },
            { id: "expired", label: "Expired" },
            { id: "unauthorized", label: "401" },
            { id: "denied", label: "403" },
          ] as { id: AuthState; label: string }[]
        ).map((s) => (
          <button
            key={s.id}
            onClick={() => setState(s.id)}
            className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition-all cursor-pointer ${
              state === s.id
                ? "bg-primary text-white border-primary"
                : "bg-white dark:bg-slate-700 text-text-secondary border-border hover:bg-slate-100"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Rendering */}
      {state === "login" && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Welcome back
            </h2>
            <p className="text-sm text-text-secondary">
              Enter your credential keys to access your portal.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Email, Mobile, or ID"
              type="text"
              placeholder="e.g. name@school.edu or +1234567890"
              required
              floating
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="space-y-1">
              <Input
                label="Security Key / Password"
                type="password"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                required
                floating
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setState("forgot")}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  Forgot your secret key?
                </button>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Authenticate Credentials
          </Button>
        </form>
      )}

      {state === "2fa" && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1 text-center">
            <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-3">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Two Factor Screen
            </h2>
            <p className="text-sm text-text-secondary">
              Open your authenticator app to retrieve the security code.
            </p>
          </div>

          <Input
            label="MFA Authenticator Code"
            placeholder="000 000"
            required
            maxLength={6}
            className="text-center tracking-widest text-lg"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setState("login")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSubmitting}
            >
              Verify Code
            </Button>
          </div>
        </form>
      )}

      {state === "otp" && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1 text-center">
            <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-3">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              OTP Verification
            </h2>
            <p className="text-sm text-text-secondary">
              We sent a temporary one-time password code to your mobile device.
            </p>
          </div>

          <Input
            label="Enter 6-Digit OTP Code"
            placeholder="XXXXXX"
            required
            maxLength={6}
            className="text-center tracking-widest text-lg"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />

          <div className="text-center">
            <button
              type="button"
              onClick={() => toast("Code Resent", { type: "info" })}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Resend verification code
            </button>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setState("login")}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSubmitting}
            >
              Verify OTP
            </Button>
          </div>
        </form>
      )}

      {state === "forgot" && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Forgot Password
            </h2>
            <p className="text-sm text-text-secondary">
              Input your register campus email to receive reset credentials.
            </p>
          </div>

          <Input
            label="Account Email Address"
            type="email"
            placeholder="name@school.edu"
            required
            floating
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setState("login")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={isSubmitting}
            >
              Send Reset Link
            </Button>
          </div>
        </form>
      )}

      {state === "reset" && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Reset Password
            </h2>
            <p className="text-sm text-text-secondary">
              Enter your new secure password credential code.
            </p>
          </div>

          <Input
            label="New Password"
            type="password"
            placeholder="New secure password"
            required
            floating
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm secure password"
            required
            floating
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Apply Password Reset
          </Button>
        </form>
      )}

      {state === "email-verify" && (
        <div className="space-y-5 text-center">
          <div className="inline-flex p-3 bg-success/10 rounded-full text-success mb-3">
            <Mail className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Email Verification
            </h2>
            <p className="text-sm text-text-secondary">
              An activation message was dispatched to your mail. Click the link inside to verify.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setState("login")}
          >
            Return to Login
          </Button>
        </div>
      )}

      {state === "locked" && (
        <div className="space-y-5 text-center">
          <div className="inline-flex p-3 bg-danger/10 rounded-full text-danger mb-3">
            <Lock className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Account Locked
            </h2>
            <p className="text-sm text-text-secondary">
              Due to multiple unsuccessful access key attempts, your terminal access is suspended.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 text-[11px] rounded-btn border text-text-secondary">
              Locked on: {new Date().toLocaleTimeString()} &bull; Code: ERR_AUTH_LOCK_L5
            </div>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              setState("login");
              toast("Contacting registrar to unlock...", { type: "info" });
            }}
          >
            Contact Administrator
          </Button>
        </div>
      )}

      {state === "changed" && (
        <div className="space-y-5 text-center">
          <div className="inline-flex p-3 bg-success/10 rounded-full text-success mb-3">
            <UserCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Password Changed
            </h2>
            <p className="text-sm text-text-secondary">
              Your credentials were modified successfully. Please sign in again.
            </p>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setState("login")}
          >
            Return to login
          </Button>
        </div>
      )}

      {state === "expired" && (
        <div className="space-y-5 text-center">
          <div className="inline-flex p-3 bg-warning/10 rounded-full text-warning mb-3">
            <RotateCcw className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Session Expired
            </h2>
            <p className="text-sm text-text-secondary">
              Your login ticket has expired due to inactivity. Re-verify credentials.
            </p>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setState("login")}
          >
            Sign Back In
          </Button>
        </div>
      )}

      {state === "unauthorized" && (
        <div className="space-y-5 text-center">
          <div className="inline-flex p-3 bg-danger/10 rounded-full text-danger mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Unauthorized Access
            </h2>
            <p className="text-sm text-text-secondary">
              You are not logged in. You must verify identity before accessing these logs.
            </p>
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setState("login")}
          >
            Sign In Now
          </Button>
        </div>
      )}

      {state === "denied" && (
        <div className="space-y-5 text-center">
          <div className="inline-flex p-3 bg-danger/10 rounded-full text-danger mb-3">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              Access Denied
            </h2>
            <p className="text-sm text-text-secondary">
              Permission level insufficient. You require Gradebook Editor clearance.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setState("login")}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
