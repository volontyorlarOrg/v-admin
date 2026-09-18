"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api, authedApi } from "@/lib/api/client.server";
import { endpoints, pathFor } from "@/lib/api/endpoints";
import {
  failedResult,
  okResult,
  resultFromError,
  type ActionResult,
} from "@/lib/api/action-result";
import { AUTH_REQUEST_TIMEOUT_MS, isAuthConfigured } from "@/lib/auth/config";
import {
  changePasswordFromFormData,
  changePasswordSchema,
  credentialsFromFormData,
  fieldErrorsOf,
  logInSchema,
  stringField,
} from "@/lib/auth/credentials";
import {
  holdsPortalRole,
  issuedSessionSchema,
  safeReturnPath,
  toSessionPayload,
} from "@/lib/auth/session";
import { clearSession, getSession, writeSession } from "@/lib/auth/session.server";
import { defaultLocale, isLocale, type Locale } from "@/i18n/routing";
import {
  ENTRY_ROUTE,
  HOME_ROUTE,
  PASSWORD_ROUTE,
  localePath,
} from "@/lib/routing/routes";

function localeOf(formData: FormData): Locale {
  const requested = formData.get("locale");
  return isLocale(requested) ? requested : defaultLocale;
}

export async function logInAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = logInSchema.safeParse(credentialsFromFormData(formData));
  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  if (!isAuthConfigured()) return failedResult("portalUnavailable");

  const locale = localeOf(formData);
  let passwordChangeRequired = false;

  try {
    const issued = await api(pathFor("logIn"), {
      method: endpoints.logIn.method,
      body: parsed.data,
      schema: issuedSessionSchema,
      timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    });

    const session = toSessionPayload(issued);
    if (!holdsPortalRole(session)) return failedResult("wrongRole");

    passwordChangeRequired = session.passwordChangeRequired;
    if (!(await writeSession(session))) return failedResult("portalUnavailable");
  } catch (error) {
    return resultFromError(error);
  }

  revalidatePath("/", "layout");

  const requested = safeReturnPath(stringField(formData, "next"));
  const destination = passwordChangeRequired
    ? localePath(locale, PASSWORD_ROUTE)
    : (requested ?? localePath(locale, HOME_ROUTE));

  redirect(destination);
}

export async function signOutAction(formData: FormData) {
  const locale = localeOf(formData);
  const session = await getSession();

  if (session) {
    try {
      await authedApi(pathFor("logOut"), session.accessToken, {
        method: endpoints.logOut.method,
      });
    } catch (error) {
      console.error(
        "[auth] backend sign-out failed; clearing the cookie anyway",
        error,
      );
    }
  }

  await clearSession();
  revalidatePath("/", "layout");
  redirect(`${localePath(locale, ENTRY_ROUTE)}?session=signedOut`);
}

export async function changePasswordAction(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(changePasswordFromFormData(formData));
  if (!parsed.success) {
    return failedResult("validationFailed", fieldErrorsOf(parsed.error));
  }

  const session = await getSession();
  if (!session) return failedResult("sessionExpired");

  try {
    await authedApi(pathFor("changePassword"), session.accessToken, {
      method: endpoints.changePassword.method,
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      },
    });
  } catch (error) {
    return resultFromError(error);
  }

  await writeSession({ ...session, passwordChangeRequired: false });
  revalidatePath("/", "layout");
  return okResult;
}
