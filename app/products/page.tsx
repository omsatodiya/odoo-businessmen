import { BarChart3, Boxes, Gauge, PackageSearch, ShieldCheck, Truck } from "lucide-react"

import { RouteShell, ShellCard } from "@/components/pages/route-shell"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

const productHighlights = [
  {
    title: "Catalog health",
    description: "Track the items that are ready to publish, out of stock, or missing metadata.",
    icon: Boxes,
  },
  {
    title: "Performance",
    description: "Keep the product route server-rendered and lean so the page remains fast at scale.",
    icon: Gauge,
  },
  {
    title: "Search readiness",
    description: "The UI is structured for future search, filters, and pagination without redesigning the page.",
    icon: PackageSearch,
  },
  {
    title: "Operations",
    description: "Prepare for stock, fulfillment, and shipping workflows without coupling them to the view layer.",
    icon: Truck,
  },
]

export default function ProductsPage() {
  return (
    <main>
      <RouteShell
        eyebrow="Catalog"
        badge="Server-rendered route"
        title="Products"
        description="A clean product workspace shell for future inventory, merchandising, and analytics features. The page is intentionally static for now so it stays fast and honest about the missing model layer."
        cta={{ href: "/users", label: "Go to users" }}
        secondaryCta={{ href: "/organizations", label: "View organizations" }}
        stats={[
          { label: "status", value: "Ready", detail: "Route is in place and optimized for future data." },
          { label: "latency", value: "Low", detail: "No unnecessary client fetches on initial render." },
          { label: "security", value: "Strict", detail: "No hidden API surface until a real model exists." },
        ]}
      >
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <ShellCard
            title="Planned product operations"
            description="This is where product lifecycle and merchandising flows can be layered in once a real schema exists."
            icon={BarChart3}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {productHighlights.map((item) => (
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

          <div className="space-y-4">
            <div className="rounded-none border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                <Badge variant="outline">No product model yet</Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                The application currently ships only the users data pipeline. Rather than inventing a
                fake API, this page keeps the route visible and routes future work to a proper schema.
              </p>
            </div>

            <Empty className="border border-dashed border-border/70 bg-card/60">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Boxes />
                </EmptyMedia>
                <EmptyTitle>Product records will live here</EmptyTitle>
                <EmptyDescription>
                  When the Prisma schema is extended, this view can connect to a real product API,
                  search controls, and row actions.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          </div>
        </div>
      </RouteShell>
    </main>
  )
}
