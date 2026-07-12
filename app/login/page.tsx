import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";

const ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-muted/40 p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary">
            T
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">TransitOps</p>
            <p className="text-xs text-muted-foreground">Smart Transport Operations Platform</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">One login, four roles:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {ROLES.map((role) => (
              <li key={role} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                {role}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          TransitOps © {new Date().getFullYear()} · RBAC-enabled
        </p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LoginForm />

            <div className="space-y-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
              <p>Access is scoped by role after login:</p>
              <p>Fleet Manager → Fleet, Maintenance</p>
              <p>Dispatcher → Dashboard, Trips</p>
              <p>Safety Officer → Drivers, Compliance</p>
              <p>Financial Analyst → Fuel &amp; Expenses, Analytics</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
