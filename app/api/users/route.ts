import { UserSchema } from "@/types/user-types"
import { Api } from "@/lib/api"
import { logger } from "@/lib/logger"
import { searchUserIds, upsertUsersInSearch } from "@/lib/meilisearch"
import { prisma } from "@/lib/prisma"
import {
  buildPrismaOrderBy,
  buildPrismaWhere,
  parseFilterRulesParam,
  parsePaginationParams,
  parseSearchParams,
  parseSortRulesParam,
} from "@/lib/user-list-query"

export async function GET(req: Request) {
  const startedAt = performance.now()
  const requestId = crypto.randomUUID()

  try {
    const searchParams = new URL(req.url).searchParams

    const searchResult = parseSearchParams(
      searchParams.get("searchField"),
      searchParams.get("search")
    )
    if (!searchResult.success) {
      return Api.badRequest(searchResult.error)
    }

    const pagination = parsePaginationParams(
      searchParams.get("page"),
      searchParams.get("limit")
    )
    if ("error" in pagination) {
      return Api.badRequest(pagination.error)
    }

    const filtersResult = parseFilterRulesParam(searchParams.get("filters"))
    if (!filtersResult.success) {
      return Api.badRequest(filtersResult.error)
    }

    const sortsResult = parseSortRulesParam(searchParams.get("sorts"))
    if (!sortsResult.success) {
      return Api.badRequest(sortsResult.error)
    }

    const { page, limit } = pagination
    const skip = (page - 1) * limit
    const searchIds = await searchUserIds(
      searchResult.data.query,
      searchResult.data.field,
      Math.min(1000, Math.max(limit * page, 50))
    )
    const where = buildPrismaWhere(
      filtersResult.data,
      searchResult.data.field,
      searchIds === null ? searchResult.data.query : "",
      searchIds ?? undefined
    )
    const orderBy = buildPrismaOrderBy(sortsResult.data)

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    logger.info("users.list", {
      requestId,
      durationMs: Math.round(performance.now() - startedAt),
      count: users.length,
      total,
      searchProvider: searchIds === null && searchResult.data.query ? "postgres" : searchResult.data.query ? "meilisearch" : "none",
    })

    return Api.ok(users, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchProvider: searchIds === null && searchResult.data.query ? "postgres" : searchResult.data.query ? "meilisearch" : "none",
    })
  } catch (error) {
    logger.error("users.list.failed", error, { requestId })
    return Api.internalError("Failed to fetch users")
  }
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID()

  try {
    const body = await req.json()
    const validation = UserSchema.safeParse(body)

    if (!validation.success) {
      return Api.badRequest("Invalid user data provided", validation.error.format())
    }

    const user = await prisma.user.create({
      data: {
        name: validation.data.name,
        email: validation.data.email,
        role: validation.data.role,
        location: validation.data.location || null,
        gender: validation.data.gender || null,
      },
    })

    void upsertUsersInSearch([user])
    logger.info("users.create", { requestId, userId: user.id })

    return Api.created(user)
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return Api.conflict("A user with this email already exists")
    }
    logger.error("users.create.failed", error, { requestId })
    return Api.internalError("Failed to create user")
  }
}
