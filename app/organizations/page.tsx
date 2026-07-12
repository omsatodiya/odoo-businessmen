import { Building2, Globe2, LockKeyhole, ShieldCheck, Users2, Workflow } from "lucide-react"

import { RouteShell, ShellCard } from "@/components/pages/route-shell"
import { Badge } from "@/components/ui/badge"

const organizationCapabilities = [
  {
    title: "Access boundaries",
    description: "Model tenant-aware authorization before exposing mutable organization data.",
    icon: LockKeyhole,
  },
  {
    title: "Team structure",
    description: "Surface members, permissions, and administrative roles in a predictable hierarchy.",
    icon: Users2,
  },
  {
    title: "Regional readiness",
    description: "Design for locale, currency, and legal entity separation if you expand globally.",
    icon: Globe2,
  },
  {
    title: "Workflow clarity",
    description: "Keep approval and provisioning flows separate from the view layer for easier scaling.",
    icon: Workflow,
  },
]

export default function OrganizationsPage() {
  return (
    <main>
      <RouteShell
        eyebrow="Tenancy"
        badge="Architecture-first route"
        title="Organizations"
        description="A route scaffold for future tenant, team, and permission management. It is server-rendered, compact, and structured so a real database-backed model can be added later without a rewrite."
        cta={{ href: "/users", label: "Manage users" }}
        secondaryCta={{ href: "/products", label: "Review products" }}
        stats={[
          { label: "model", value: "Pending", detail: "No organization table exists in Prisma yet." },
          { label: "scope", value: "Multi-tenant ready", detail: "The layout anticipates tenant-specific roles and controls." },
          { label: "access", value: "Secure", detail: "Authorization should be enforced server-side when the model lands." },
        ]}
      >
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-none border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <Badge variant="outline">Future tenant hub</Badge>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              This page is intentionally not backed by an API. That keeps the latency profile low and
              avoids introducing fake CRUD surfaces before the database schema is ready.
            </p>
          </div>

          <ShellCard
            title="What belongs on this page next"
            description="These blocks define the shape of the future implementation without coupling the route to a premature schema."
            icon={ShieldCheck}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {organizationCapabilities.map((item) => (
                <div key={item.title} className="rounded-none border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex size-10 items-center justify-center border border-border bg-primary/10 text-primary">
                    <item.icon className="size-4" />
                  </div>
                  <h2 className="font-medium text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </ShellCard>
        </div>
      </RouteShell>
    </main>
  )
}
