"use client";

import { useActionState } from "react";
import { signInAction, signUpAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { initialActionState } from "@/lib/forms";

type AuthFormProps = {
  previewMode: boolean;
};

export function AuthForm({ previewMode }: AuthFormProps) {
  const [signInState, signInFormAction] = useActionState(
    signInAction,
    initialActionState,
  );
  const [signUpState, signUpFormAction] = useActionState(
    signUpAction,
    initialActionState,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="glass-panel p-6 sm:p-8">
        <div className="space-y-2">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to manage listings, track pickups, and keep the donation loop moving.
          </CardDescription>
        </div>
        <form action={signInFormAction} className="mt-6 space-y-4">
          <Input name="email" placeholder="name@example.com" type="email" />
          <Input name="password" placeholder="Password" type="password" />
          {signInState.message ? (
            <p
              className={`text-sm ${
                signInState.status === "error" ? "text-danger" : "text-success"
              }`}
            >
              {signInState.message}
            </p>
          ) : null}
          {previewMode ? (
            <Button className="w-full" disabled variant="outline">
              Connect Supabase to enable sign-in
            </Button>
          ) : (
            <SubmitButton className="w-full" idleLabel="Sign in" />
          )}
        </form>
      </Card>

      <Card className="glass-panel p-6 sm:p-8">
        <div className="space-y-2">
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Donors can start listing right away. NGOs can register and then be verified by an admin.
          </CardDescription>
        </div>
        <form action={signUpFormAction} className="mt-6 space-y-4">
          <Input name="fullName" placeholder="Full name" />
          <Select defaultValue="donor" name="role">
            <option value="donor">Donor</option>
            <option value="ngo">NGO staff</option>
          </Select>
          <Input name="email" placeholder="name@example.com" type="email" />
          <Input name="password" placeholder="Create a password" type="password" />
          {signUpState.message ? (
            <p
              className={`text-sm ${
                signUpState.status === "error" ? "text-danger" : "text-success"
              }`}
            >
              {signUpState.message}
            </p>
          ) : null}
          {previewMode ? (
            <Button className="w-full" disabled variant="outline">
              Connect Supabase to enable sign-up
            </Button>
          ) : (
            <SubmitButton className="w-full" idleLabel="Create account" />
          )}
        </form>
      </Card>
    </div>
  );
}
