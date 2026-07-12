import { UserIdSchema, UserSchema } from "@/types/user-types"
import { Api } from "@/lib/api"
import { deleteUserFromSearch, upsertUsersInSearch } from "@/lib/meilisearch"
import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID()

  try {
    const params = await props.params;
    const idResult = UserIdSchema.safeParse(params)
    if (!idResult.success) {
      return Api.badRequest("Invalid user identifier", idResult.error.format())
    }

    const body = await req.json()
    const validation = UserSchema.safeParse(body)
    
    if (!validation.success) {
      return Api.badRequest("Invalid user data provided", validation.error.format())
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: idResult.data.id }
    })

    if (!existingUser) {
      return Api.notFound("User not found")
    }
    
    const user = await prisma.user.update({
      where: { id: idResult.data.id },
      data: {
        name: validation.data.name,
        email: validation.data.email,
        role: validation.data.role,
        location: validation.data.location || null,
        gender: validation.data.gender || null,
      }
    })

    void upsertUsersInSearch([user])
    logger.info("users.update", { requestId, userId: user.id })
    
    return Api.ok(user)
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Api.conflict("A user with this email already exists")
    }
    logger.error("users.update.failed", error, { requestId })
    return Api.internalError("Failed to update user")
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID()

  try {
    const params = await props.params;
    const idResult = UserIdSchema.safeParse(params)
    if (!idResult.success) {
      return Api.badRequest("Invalid user identifier", idResult.error.format())
    }
    
    const existingUser = await prisma.user.findUnique({
      where: { id: idResult.data.id }
    })

    if (!existingUser) {
      // Return 204 on second delete (idempotent design)
      return Api.noContent()
    }

    const deletedUser = await prisma.user.delete({
      where: { id: idResult.data.id }
    })

    void deleteUserFromSearch(deletedUser.id)
    logger.info("users.delete", { requestId, userId: deletedUser.id })
    
    return Api.noContent()
  } catch (error) {
    logger.error("users.delete.failed", error, { requestId })
    return Api.internalError("Failed to delete user")
  }
}
