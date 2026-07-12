"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { MoreHorizontal, Plus, Search, Loader2, Eye, Edit, Trash2, User, Mail, Shield, MapPin, Hash, Users, Filter, CalendarDays, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CountBadge } from "@/components/ui/count-badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, ColumnDef } from "@/components/ui/data-table"
import { CreateModal } from "@/components/modals/create-modal"
import { ViewModal } from "@/components/modals/view-modal"
import { EditModal } from "@/components/modals/edit-modal"
import { DeleteModal } from "@/components/modals/delete-modal"
import { SortModal } from "@/components/modals/sort-modal"
import { FilterModal } from "@/components/modals/filter-modal"
import { TableFetchOverlay } from "@/components/tables/table-fetch-overlay"
import { TablePagination } from "@/components/tables/table-pagination"
import {
  searchFieldTriggerClass,
  searchInputClass,
  searchToolbarClass,
  selectContentMatchTriggerClass,
  tableToolbarButtonClass,
  tableToolbarIconClass,
  tableToolbarSelectItemClass,
  tableToolbarTextClass,
} from "@/components/tables/table-toolbar-styles"
import {
  crudFormFieldsClass,
  crudModalButtonClass,
  crudModalFooterClass,
  crudViewFieldsClass,
} from "@/components/modals/crud-modal-styles"
import { UserType } from "@/types/user-types"
import {
  SEARCH_FIELD_META,
  USER_SEARCHABLE_FIELDS,
} from "@/types/user-query-types"
import type { UserSearchableField } from "@/types/user-query-types"
import { USER_FILTER_CONFIG, USER_SORT_OPTIONS } from "@/lib/users-list-config"
import { useUsersListSync } from "@/hooks/use-users-list-sync"
import {
  useUsersStore,
  selectIsControlsDisabled,
  selectIsSearchPending,
  selectSearchFieldMeta,
} from "@/store"

export function UsersTable() {
  useUsersListSync()

  const users = useUsersStore((s) => s.users)
  const isFetching = useUsersStore((s) => s.isFetching)
  const fetchTrigger = useUsersStore((s) => s.fetchTrigger)
  const searchInput = useUsersStore((s) => s.searchInput)
  const searchField = useUsersStore((s) => s.searchField)
  const setSearchInput = useUsersStore((s) => s.setSearchInput)
  const setSearchField = useUsersStore((s) => s.setSearchField)
  const page = useUsersStore((s) => s.page)
  const limit = useUsersStore((s) => s.limit)
  const sorts = useUsersStore((s) => s.sorts)
  const filters = useUsersStore((s) => s.filters)
  const totalPages = useUsersStore((s) => s.totalPages)
  const totalUsers = useUsersStore((s) => s.totalUsers)
  const searchProvider = useUsersStore((s) => s.searchProvider)

  const isCreateOpen = useUsersStore((s) => s.isCreateOpen)
  const viewUser = useUsersStore((s) => s.viewUser)
  const editUser = useUsersStore((s) => s.editUser)
  const deleteUser = useUsersStore((s) => s.deleteUser)
  const isSortOpen = useUsersStore((s) => s.isSortOpen)
  const isFilterOpen = useUsersStore((s) => s.isFilterOpen)
  const formData = useUsersStore((s) => s.formData)
  const isSubmitting = useUsersStore((s) => s.isSubmitting)

  const openCreateModal = useUsersStore((s) => s.openCreateModal)
  const closeCreateModal = useUsersStore((s) => s.closeCreateModal)
  const openViewModal = useUsersStore((s) => s.openViewModal)
  const closeViewModal = useUsersStore((s) => s.closeViewModal)
  const openEditModal = useUsersStore((s) => s.openEditModal)
  const closeEditModal = useUsersStore((s) => s.closeEditModal)
  const openDeleteModal = useUsersStore((s) => s.openDeleteModal)
  const closeDeleteModal = useUsersStore((s) => s.closeDeleteModal)
  const setSortModalOpen = useUsersStore((s) => s.setSortModalOpen)
  const setFilterModalOpen = useUsersStore((s) => s.setFilterModalOpen)
  const setFormData = useUsersStore((s) => s.setFormData)
  const createUser = useUsersStore((s) => s.createUser)
  const updateUser = useUsersStore((s) => s.updateUser)
  const removeUser = useUsersStore((s) => s.removeUser)
  const applySorts = useUsersStore((s) => s.applySorts)
  const applyFilters = useUsersStore((s) => s.applyFilters)
  const handlePageChange = useUsersStore((s) => s.handlePageChange)
  const handleLimitChange = useUsersStore((s) => s.handleLimitChange)

  const searchMeta = useUsersStore(selectSearchFieldMeta)
  const isSearchPending = useUsersStore(selectIsSearchPending)
  const isControlsDisabled = useUsersStore(selectIsControlsDisabled)

  const renderFormFields = () => (
    <div className={crudFormFieldsClass}>
      <div className="grid gap-2">
        <Label htmlFor="name" className="flex items-center">
          <User className="mr-2 h-4 w-4 text-muted-foreground" /> Name <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Doe"
          className="rounded-none shadow-sm"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email" className="flex items-center">
          <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ""}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@example.com"
          className="rounded-none shadow-sm"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="role" className="flex items-center">
            <Shield className="mr-2 h-4 w-4 text-muted-foreground" /> Role <span className="text-destructive ml-1">*</span>
          </Label>
          <Select 
            value={formData.role || "USER"} 
            onValueChange={(value) =>
              setFormData({ ...formData, role: value as UserType["role"] })
            }
            required
          >
            <SelectTrigger className="h-8 w-full cursor-pointer rounded-none bg-background text-xs shadow-sm sm:h-9 sm:text-sm">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="USER" className="cursor-pointer">User</SelectItem>
              <SelectItem value="MANAGER" className="cursor-pointer">Manager</SelectItem>
              <SelectItem value="ADMIN" className="cursor-pointer">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gender" className="flex items-center">
            <Users className="mr-2 h-4 w-4 text-muted-foreground" /> Gender <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
          </Label>
          <Select 
            value={formData.gender || ""} 
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
          >
            <SelectTrigger className="h-8 w-full cursor-pointer rounded-none bg-background text-xs shadow-sm sm:h-9 sm:text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="Male" className="cursor-pointer">Male</SelectItem>
              <SelectItem value="Female" className="cursor-pointer">Female</SelectItem>
              <SelectItem value="Other" className="cursor-pointer">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="location" className="flex items-center">
          <MapPin className="mr-2 h-4 w-4 text-muted-foreground" /> Location <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
        </Label>
        <Input
          id="location"
          value={formData.location || ""}
          onChange={e => setFormData({ ...formData, location: e.target.value })}
          placeholder="New York, USA"
          className="rounded-none shadow-sm"
        />
      </div>
    </div>
  )

  const columns: ColumnDef<UserType>[] = [
    {
      header: <div className="flex items-center"><User className="mr-2 h-4 w-4" /> Name</div>,
      accessorKey: "name",
      className: "font-medium"
    },
    {
      header: <div className="flex items-center"><Mail className="mr-2 h-4 w-4" /> Email</div>,
      accessorKey: "email"
    },
    {
      header: <div className="flex items-center"><Shield className="mr-2 h-4 w-4" /> Role</div>,
      cell: (user) => (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
          {user.role}
        </span>
      )
    },
    {
      header: <div className="flex items-center"><MapPin className="mr-2 h-4 w-4" /> Location</div>,
      cell: (user) => user.location || "-"
    },
    {
      header: <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Created</div>,
      cell: (user) => (
        <span className="text-muted-foreground">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
        </span>
      )
    },
    {
      header: "Actions",
      className: "w-[80px]",
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-none">
            <DropdownMenuItem onClick={() => openViewModal(user)} className="cursor-pointer focus:bg-primary/10 focus:text-primary">
              <Eye className="mr-2 h-4 w-4" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditModal(user)} className="cursor-pointer focus:bg-primary/10 focus:text-primary">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDeleteModal(user)} variant="destructive" className="cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  return (
    <div className="w-full min-w-0 space-y-4 overflow-hidden">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2">
          <div className={searchToolbarClass}>
            <div className="min-w-0 w-full">
            <Select
              value={searchField}
              onValueChange={(value) => setSearchField(value as UserSearchableField)}
              disabled={isControlsDisabled}
            >
              <SelectTrigger className={searchFieldTriggerClass}>
                <SelectValue placeholder="Search by" />
              </SelectTrigger>
              <SelectContent
                className={selectContentMatchTriggerClass}
                position="popper"
                sideOffset={4}
              >
                {USER_SEARCHABLE_FIELDS.map((field) => (
                  <SelectItem key={field} value={field} className={tableToolbarSelectItemClass}>
                    {SEARCH_FIELD_META[field].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            <div className="relative min-w-0">
              {(isSearchPending || (isFetching && fetchTrigger === "search")) ? (
                <Loader2 className={`absolute top-1/2 left-2.5 -translate-y-1/2 animate-spin text-primary ${tableToolbarIconClass}`} />
              ) : (
                <Search className={`absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground ${tableToolbarIconClass}`} />
              )}
              <Input
                placeholder={searchMeta.placeholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={isFetching && fetchTrigger !== "search" && users.length === 0}
                className={searchInputClass}
              />
              {searchInput.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-0 top-0 h-9 rounded-none px-2.5 cursor-pointer hover:text-foreground ${tableToolbarTextClass} text-muted-foreground`}
                  onClick={() => setSearchInput("")}
                  disabled={isControlsDisabled}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              className={`relative flex-1 sm:flex-none ${tableToolbarButtonClass}`}
              onClick={() => setFilterModalOpen(true)}
              disabled={isControlsDisabled}
            >
              <Filter className={tableToolbarIconClass} />
              Filter
              <CountBadge count={filters.length} />
            </Button>
            <Button
              variant="outline"
              className={`relative flex-1 sm:flex-none ${tableToolbarButtonClass}`}
              onClick={() => setSortModalOpen(true)}
              disabled={isControlsDisabled}
            >
              <ArrowUpDown className={tableToolbarIconClass} />
              Sort
              <CountBadge count={sorts.length} />
            </Button>
          </div>
        </div>
        <Button
          onClick={openCreateModal}
          className={`w-full md:w-auto ${tableToolbarButtonClass}`}
        >
          <Plus className={tableToolbarIconClass} /> Add User
        </Button>
      </div>

      {searchInput.trim().length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="border border-border bg-card px-2 py-1">
            Search engine: {searchProvider === "meilisearch" ? "Meilisearch" : searchProvider === "postgres" ? "Postgres fallback" : "Idle"}
          </span>
          {searchProvider === "postgres" ? (
            <span className="text-destructive">
              Meilisearch is unavailable, so results are using database search.
            </span>
          ) : null}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={users}
        isLoading={isFetching || isSearchPending}
        loadingTrigger={isSearchPending ? "search" : fetchTrigger}
        emptyMessage="No users found."
        getRowKey={(user) => user.id ?? user.email}
      />

      <div className="relative grid grid-cols-1 gap-4 md:hidden">
        <TableFetchOverlay
          isVisible={isFetching && users.length > 0}
          trigger={isSearchPending ? "search" : fetchTrigger}
        />

        {isFetching && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 border border-border bg-card p-8 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              {isSearchPending || fetchTrigger === "search"
                ? "Searching..."
                : fetchTrigger === "pagination"
                  ? "Loading page..."
                  : fetchTrigger === "sort"
                    ? "Applying sort..."
                    : fetchTrigger === "filter"
                      ? "Applying filters..."
                      : "Loading users..."}
            </span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex justify-center p-8 border border-border bg-card shadow-sm text-muted-foreground">
            No users found.
          </div>
        ) : (
          users.map((user) => (
            <motion.div
              key={user.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: isFetching ? 0.6 : 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 border border-border bg-card p-5 shadow-sm transition-colors hover:border-foreground/20"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none">
                    <DropdownMenuItem onClick={() => openViewModal(user)} className="cursor-pointer focus:bg-primary/10 focus:text-primary">
                      <Eye className="mr-2 h-4 w-4" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditModal(user)} className="cursor-pointer focus:bg-primary/10 focus:text-primary">
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDeleteModal(user)} variant="destructive" className="cursor-pointer">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                  {user.role}
                </span>
                <span className="text-sm text-muted-foreground flex items-center">
                  <MapPin className="mr-1 h-3 w-3" /> {user.location || "No location"}
                </span>
                <span className="text-sm text-muted-foreground flex items-center ml-auto">
                  <CalendarDays className="mr-1 h-3 w-3" /> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        limit={limit}
        totalUsers={totalUsers}
        rowsOnPage={users.length}
        isFetching={isFetching}
        fetchTrigger={fetchTrigger}
        isDisabled={isControlsDisabled}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />

      <SortModal
        isOpen={isSortOpen}
        onClose={() => setSortModalOpen(false)}
        options={USER_SORT_OPTIONS}
        currentSorts={sorts}
        onApply={applySorts}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setFilterModalOpen(false)}
        config={USER_FILTER_CONFIG}
        currentFilters={filters}
        onApply={applyFilters}
      />

      <CreateModal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        title="Add User"
        description="Create a new user entry. Click save when you're done."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void createUser()
          }}
          className="flex flex-col h-full"
        >
          <div className="flex-1 overflow-y-auto px-0.5">
            {renderFormFields()}
          </div>
          <div className={crudModalFooterClass}>
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateModal}
              className={`${crudModalButtonClass} w-full sm:w-auto`}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`${crudModalButtonClass} w-full sm:w-auto`}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CreateModal>

      <EditModal
        isOpen={!!editUser}
        onClose={closeEditModal}
        title="Edit User"
        description="Make changes to the user's data here. Click save when you're done."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void updateUser()
          }}
          className="flex flex-col h-full"
        >
          <div className="flex-1 overflow-y-auto px-0.5">
            {renderFormFields()}
          </div>
          <div className={crudModalFooterClass}>
            <Button
              type="button"
              variant="outline"
              onClick={closeEditModal}
              className={`${crudModalButtonClass} w-full sm:w-auto`}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`${crudModalButtonClass} w-full sm:w-auto`}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </EditModal>

      <ViewModal
        isOpen={!!viewUser}
        onClose={closeViewModal}
        title="User Details"
      >
        {viewUser && (
          <div className={crudViewFieldsClass}>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="col-span-2">
                <span className="field-label mb-1 flex items-center font-medium text-muted-foreground">
                  <Hash className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> User ID
                </span>
                <p className="field-value break-all rounded-none border border-border bg-muted/50 p-2 font-mono">
                  {viewUser.id}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="field-label mb-1 flex items-center font-medium text-muted-foreground">
                  <User className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Name
                </span>
                <p className="field-value font-medium">{viewUser.name}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="field-label mb-1 flex items-center font-medium text-muted-foreground">
                  <Mail className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Email
                </span>
                <p className="field-value">{viewUser.email}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="field-label mb-1 flex items-center font-medium text-muted-foreground">
                  <Shield className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Role
                </span>
                <p className="field-value">
                  <span className="inline-flex items-center rounded-none bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary sm:px-2.5 sm:text-xs">
                    {viewUser.role}
                  </span>
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="field-label mb-1 flex items-center font-medium text-muted-foreground">
                  <MapPin className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Location
                </span>
                <p className="field-value">{viewUser.location || "N/A"}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="field-label mb-1 flex items-center font-medium text-muted-foreground">
                  <Users className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Gender
                </span>
                <p className="field-value">{viewUser.gender || "N/A"}</p>
              </div>
            </div>
            <div className={crudModalFooterClass}>
              <Button
                onClick={closeViewModal}
                className={`${crudModalButtonClass} w-full sm:w-auto`}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </ViewModal>

      <DeleteModal
        isOpen={!!deleteUser}
        onClose={closeDeleteModal}
        onConfirm={() => void removeUser()}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteUser?.name}? This action cannot be undone.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
