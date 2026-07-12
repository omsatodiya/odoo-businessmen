import Link from "next/link"
import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react"

import { AuthShell } from "@/components/pages/auth-shell"
import { AuthForm } from "@/components/pages/auth-form"
import { Card, CardContent } from "@/components/ui/card"

export default function SignupPage() {
  return (
    <main>
      <AuthShell
        badge="Create account"
        eyebrow="Authentication"
        title="Set up a new workspace identity"
        description="Build your onboarding flow on top of this route when you add a real auth backend. Until then, the page provides the complete UI shell and validation-ready inputs."
        footerHref="/login"
        footerLabel="Already have an account? Sign in"
      >
        <AuthForm mode="signup" />
      </AuthShell>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="flex items-start gap-3 px-4 py-4">
              <div className="flex size-10 items-center justify-center border border-border bg-primary/10 text-primary">
                <BadgeCheck className="size-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Validation-ready</p>
                <p className="text-sm text-muted-foreground">Inputs use native constraints now and can accept server validation later.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="flex items-start gap-3 px-4 py-4">
              <div className="flex size-10 items-center justify-center border border-border bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Safe by default</p>
                <p className="text-sm text-muted-foreground">No secret handling or auth persistence is implemented in the demo route.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="flex items-start gap-3 px-4 py-4">
              <div className="flex size-10 items-center justify-center border border-border bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Ready for growth</p>
                <p className="text-sm text-muted-foreground">Role assignment, invites, and team provisioning can be layered in later.</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Returning user? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </section>
    </main>
  )
}