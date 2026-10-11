"use client";

import { useActionState, useState } from "react";
import { signInAction, signUpAction, demoSignInAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/forms";
import { Sparkles } from "lucide-react";

type AuthFormProps = {
  previewMode: boolean;
  showDemoPresets?: boolean;
};

export function AuthForm({ previewMode, showDemoPresets = true }: AuthFormProps) {
  const [signInEmail, setSignInEmail] = useState(showDemoPresets ? "donor@gullygood.app" : "");
  const [signInPassword, setSignInPassword] = useState(showDemoPresets ? "Password123!" : "");

  const [signInState, signInFormAction] = useActionState(
    signInAction,
    initialActionState,
  );
  const [signUpState, signUpFormAction] = useActionState(
    signUpAction,
    initialActionState,
  );

  function fillDemo(role: "donor" | "ngo" | "admin") {
    setSignInEmail(`${role}@gullygood.app`);
    setSignInPassword("Password123!");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Sign In Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <CardTitle>Welcome back</CardTitle>
            <span className="rounded-full bg-[#F1FCF5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#17A34A]">
              Quick Access
            </span>
          </div>
          <CardDescription>
            Sign in to track live pickups, respond to NGO locks, and coordinate.
          </CardDescription>
        </div>

        {/* 1-Tap Quick Instant Logins */}
        {showDemoPresets ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFA] p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                ⚡ 1-Tap Instant Login:
              </p>
              <span className="text-[10px] text-[#22C55E] font-bold">1 tap to enter</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/api/auth/demo?role=donor"
                className="rounded-full bg-white border border-[#22C55E]/40 px-3.5 py-2 text-xs font-bold text-[#14251C] shadow-xs hover:border-[#22C55E] hover:bg-[#F1FCF5] active:scale-95 transition flex items-center gap-1 cursor-pointer"
              >
                🌱 Sign in as Donor
              </a>
              <a
                href="/api/auth/demo?role=ngo"
                className="rounded-full bg-white border border-[#1CB0F6]/40 px-3.5 py-2 text-xs font-bold text-[#14251C] shadow-xs hover:border-[#1CB0F6] hover:bg-[#F0F9FF] active:scale-95 transition flex items-center gap-1 cursor-pointer"
              >
                🏢 Sign in as NGO
              </a>
              <a
                href="/api/auth/demo?role=admin"
                className="rounded-full bg-white border border-[#FFC800]/40 px-3.5 py-2 text-xs font-bold text-[#14251C] shadow-xs hover:border-[#FFC800] hover:bg-[#FFFBEB] active:scale-95 transition flex items-center gap-1 cursor-pointer"
              >
                ⚙️ Admin
              </a>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Or type custom credentials below and tap Sign in.
            </p>
          </div>
        ) : null}

        <form action={signInFormAction} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14251C]">Email address</label>
            <Input
              name="email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              placeholder="name@example.com"
              type="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14251C]">Password</label>
            <Input
              name="password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />
          </div>

          {signInState.message ? (
            <p
              className={`text-sm font-semibold ${
                signInState.status === "error" ? "text-[#FF4B4B]" : "text-[#17A34A]"
              }`}
            >
              {signInState.message}
            </p>
          ) : null}

          {previewMode ? (
            <Button className="w-full font-display" disabled variant="outline">
              Connect Supabase to enable sign-in
            </Button>
          ) : (
            <SubmitButton className="w-full font-display" idleLabel="Sign in to GullyGood" />
          )}
        </form>
      </Card>

      {/* Create Account Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Donors can start giving right away. NGOs register and are verified by admins.
          </CardDescription>
        </div>

        <form action={signUpFormAction} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14251C]">Full Name</label>
            <Input name="fullName" placeholder="Aisha Mehta" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14251C]">Account Role</label>
            <Select defaultValue="donor" name="role">
              <option value="donor">Donor (Give essentials)</option>
              <option value="ngo">NGO staff (Collect & distribute)</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14251C]">Email address</label>
            <Input name="email" placeholder="name@example.com" type="email" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#14251C]">Create password</label>
            <Input name="password" placeholder="••••••••" type="password" />
          </div>

          {signUpState.message ? (
            <p
              className={`text-sm font-semibold ${
                signUpState.status === "error" ? "text-[#FF4B4B]" : "text-[#17A34A]"
              }`}
            >
              {signUpState.message}
            </p>
          ) : null}

          {previewMode ? (
            <Button className="w-full font-display" disabled variant="outline">
              Connect Supabase to enable sign-up
            </Button>
          ) : (
            <SubmitButton className="w-full font-display" idleLabel="Create GullyGood account" />
          )}
        </form>
      </Card>
    </div>
  );
}

