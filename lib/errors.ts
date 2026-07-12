/**
 * Thrown by lib/services/* for business-rule violations (not found, invalid
 * state, blocked transition, etc). Route handlers catch this and map it to
 * Api.badRequest()/Api.conflict() — never let it leak as a 500.
 *
 * Usage in a route handler:
 *   try {
 *     await dispatchTrip(id);
 *   } catch (error) {
 *     if (error instanceof BusinessError) return Api.badRequest(error.message, { code: error.code });
 *     logger.error("...", error);
 *     return Api.internalError();
 *   }
 */
export class BusinessError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BusinessError";
    this.code = code;
  }
}
