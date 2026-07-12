"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role } from "@prisma/client";

/**
 * Convenience-only: prefills the email for each seeded demo account so the
 * Role selector below matches the "one login, four roles" framing. The
 * server never trusts this value for authorization — it always reads the
 * account's real role from the database. Keep in sync with the emails
 * created by scripts/seed-transitops.js.
 */
const DEMO_ROLE_EMAILS: Record<Role, string> = {
  FLEET_MANAGER: "fleet.manager@transitops.in",
  DISPATCHER: "raven.k@transitops.in",
  SAFETY_OFFICER: "safety.officer@transitops.in",
  FINANCIAL_ANALYST: "finance.analyst@transitops.in",
};

const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("DISPATCHER");
  const [email, setEmail] = useState(DEMO_ROLE_EMAILS.DISPATCHER);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleRoleChange(nextRole: Role) {
    setRole(nextRole);
    setEmail(DEMO_ROLE_EMAILS[nextRole]);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? "Invalid credentials.");
        return;
      }

      toast.success(`Welcome back, ${payload.data.user.name}`);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" /> Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="raven.k@transitops.in"
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="********"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role (RBAC)</Label>
        <Select value={role} onValueChange={(value) => handleRoleChange(value as Role)}>
          <SelectTrigger id="role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          Remember me
        </label>
        <Button
          type="button"
          variant="link"
          className="px-0 text-sm"
          onClick={() => toast.info("Contact your Fleet Manager to reset your password.")}
        >
          Forgot password?
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Invalid credentials</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Sign In
      </Button>
    </form>
  );
}
