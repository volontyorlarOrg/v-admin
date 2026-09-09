export const PORTAL_ID = "admin" as const;

export const PORTAL_ROLE = "admin" as const;

export const SESSION_COOKIE_NAME = "volontyorlar_admin_session";

export const SESSION_SECRET_VARIABLE = "VOLONTYORLAR_ADMIN_SESSION_SECRET";

export const LOGIN_ENDPOINT = "/auth/admin/login";

export const IS_ADMIN_PORTAL = true;

export const DEVELOPMENT_PORT = 3003;

export function rawSessionSecret(): string | undefined {
  return process.env.VOLONTYORLAR_ADMIN_SESSION_SECRET;
}
