import Link from "next/link"
import { KeyRound, ShieldCheck, Sparkles } from "lucide-react"

import { AuthShell } from "@/components/pages/auth-shell"
import { AuthForm } from "@/components/pages/auth-form"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <main>
      <AuthShell
        badge="Secure access"
        eyebrow="Authentication"
        title="Return to your workspace"
        description="This route is ready for a real auth provider. The current implementation keeps the page fast, accessible, and explicit about the missing backend."
        footerHref="/"
        footerLabel="Back to home"
      >
        <AuthForm mode="login" />
      </AuthShell>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="flex items-start gap-3 px-4 py-4">
              <div className="flex size-10 items-center justify-center border border-border bg-primary/10 text-primary">
                <KeyRound className="size-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Prepared for auth providers</p>
                <p className="text-sm text-muted-foreground">Wire in NextAuth, Clerk, or a custom route handler later.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="flex items-start gap-3 px-4 py-4">
              <div className="flex size-10 items-center justify-center border border-border bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Server-first security</p>
                <p className="text-sm text-muted-foreground">No token handling is done in the client-only demo state.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="flex items-start gap-3 px-4 py-4">
              <div className="flex size-10 items-center justify-center border border-border bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Minimal latency overhead</p>
                <p className="text-sm text-muted-foreground">The route stays mostly server-rendered until real auth is added.</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          New here? <Link href="/signup" className="text-primary hover:underline">Create an account</Link>
        </div>
      </section>
    </main>
  )
}