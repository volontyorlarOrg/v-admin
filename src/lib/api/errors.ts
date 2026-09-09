export const API_ERROR_CODES = [
  "unauthenticated",
  "forbidden",
  "notFound",
  "conflict",
  "validation",
  "rateLimited",
  "network",
  "timeout",
  "server",
  "unavailable",
  "notConfigured",
  "invalidResponse",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type FieldErrors = Record<string, string[]>;

const INTERNAL_CODES = new Set<ApiErrorCode>([
  "server",
  "invalidResponse",
  "notConfigured",
]);

export const PASSWORD_CHANGE_REQUIRED_CODE = "passwordChangeRequired";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly requestId: string | undefined;
  readonly details: unknown;

  constructor(
    code: ApiErrorCode,
    options: {
      status?: number;
      message?: string;
      requestId?: string;
      cause?: unknown;
      details?: unknown;
    } = {},
  ) {
    super(options.message ?? code, { cause: options.cause });
    this.name = "ApiError";
    this.code = code;
    this.status = options.status ?? 0;
    this.requestId = options.requestId;
    this.details = options.details;
  }

  get isUserFacing(): boolean {
    return !INTERNAL_CODES.has(this.code);
  }

  get isRetryable(): boolean {
    return (
      this.code === "network" ||
      this.code === "timeout" ||
      this.code === "server" ||
      this.code === "unavailable" ||
      this.code === "rateLimited"
    );
  }

  get backendCode(): string | null {
    const details = this.details;
    if (!details || typeof details !== "object") return null;
    const code = (details as { code?: unknown }).code;
    return typeof code === "string" && code ? code : null;
  }

  get requiresPasswordChange(): boolean {
    return this.backendCode === PASSWORD_CHANGE_REQUIRED_CODE;
  }

  get fieldErrors(): FieldErrors {
    const details = this.details;
    if (!details || typeof details !== "object") return {};
    const errors = (details as { errors?: unknown }).errors;
    if (!errors || typeof errors !== "object") return {};

    const output: FieldErrors = {};
    for (const [field, messages] of Object.entries(errors)) {
      if (Array.isArray(messages)) {
        output[field] = messages.filter(
          (item): item is string => typeof item === "string",
        );
      }
    }
    return output;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation";
  if (status === 429) return "rateLimited";
  if (status === 501 || status === 502 || status === 503 || status === 504) {
    return "unavailable";
  }
  return "server";
}

export function classifyApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new ApiError("timeout", { cause: error });
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError("network", { cause: error });
  }

  if (error instanceof TypeError) {
    return new ApiError("network", { cause: error });
  }

  return new ApiError("server", { cause: error });
}
