import { UsersTable } from "@/components/tables/users-table"

export default function UsersPage() {
  return (
    <main className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your users, roles, and permissions.
          </p>
        </div>
      </div>
      
      <UsersTable />
    </main>
  )
}
