"use client"

import * as React from "react"
import { toast } from "sonner"
import { CheckCircle2, LockKeyhole, Mail, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AuthMode = "login" | "signup"

type AuthFormProps = {
  mode: AuthMode
}

function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup"
  const [formState, setFormState] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    toast.info(
      isSignup
        ? "This template does not yet include a signup backend."
        : "This template does not yet include an authentication backend.",
      {
        description: "The route is ready; connect your auth provider or route handler next.",
      }
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {isSignup ? (
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" /> Full name
          </Label>
          <Input
            id="name"
            autoComplete="name"
            value={formState.name}
            onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
            placeholder="Jane Doe"
            required
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" /> Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={formState.email}
          onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <LockKeyhole className="size-4 text-muted-foreground" /> Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={formState.password}
          onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
          placeholder="********"
          minLength={8}
          required
        />
      </div>

      {isSignup ? (
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-muted-foreground" /> Confirm password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={formState.confirmPassword}
            onChange={(event) =>
              setFormState((current) => ({ ...current, confirmPassword: event.target.value }))
            }
            placeholder="Repeat your password"
            minLength={8}
            required
          />
        </div>
      ) : null}

      {!isSignup ? (
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={formState.rememberMe}
              onCheckedChange={(checked) =>
                setFormState((current) => ({ ...current, rememberMe: checked === true }))
              }
            />
            Remember me
          </label>
          <Button type="button" variant="link" className="px-0 text-sm">
            Forgot password?
          </Button>
        </div>
      ) : null}

      <Button type="submit" className="w-full">
        {isSignup ? "Create account" : "Sign in"}
      </Button>

      {isSignup ? (
        <p className="text-xs leading-5 text-muted-foreground">
          By creating an account, you agree to use this template as a starting point and wire your
          own server-side auth flow before production.
        </p>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          Sign-in is currently a UI-only route. Connect a secure auth provider or route handler to
          enable real authentication.
        </p>
      )}
    </form>
  )
}

export { AuthForm }
