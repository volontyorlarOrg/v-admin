import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { LegalRequestDecision } from "@/components/legal/legal-request-decision";
import { Register, RegisterNote } from "@/components/register/register";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/i18n/navigation";
import { failureOf, isReady } from "@/lib/api/load";
import { loadLegalRequests } from "@/lib/legal/data.server";
import { userHref } from "@/lib/routing/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/legal">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("title") };
}

export default async function LegalRequestsPage({
  params,
}: PageProps<"/[locale]/legal">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format, loaded] = await Promise.all([
    getTranslations("legal"),
    getFormatter(),
    loadLegalRequests(),
  ]);
  const failure = failureOf(loaded);
  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      {failure ? <LoadFailure failure={failure} /> : null}
      {isReady(loaded) ? (
        <Register
          id="legal-requests"
          title={t("open")}
          count={loaded.data.items.length}
          countLabel={t("countLabel")}
          countTone="waiting"
        >
          {loaded.data.items.length === 0 ? (
            <RegisterNote title={t("empty")} description={t("emptyDescription")} />
          ) : (
            <ul className="divide-y divide-border">
              {loaded.data.items.map((request) => (
                <li
                  key={request.id}
                  className="flex min-w-0 flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">
                        {t(`kinds.${request.kind}`)}
                      </span>
                      <time
                        dateTime={request.createdAt}
                        className="text-xs text-ink-muted"
                      >
                        {format.dateTime(new Date(request.createdAt), "stamp")}
                      </time>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {t(`deadlines.${request.kind}`)}
                    </p>
                    {request.message ? (
                      <p className="mt-2 wrap-anywhere whitespace-pre-wrap text-ink">
                        {request.message}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-ink-muted">
                      <Link
                        href={userHref(request.requester.id)}
                        className="font-medium text-primary-ink hover:underline"
                      >
                        {request.requester.displayName ?? request.requester.username}
                      </Link>
                      {request.requester.email ? ` · ${request.requester.email}` : null}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <LegalRequestDecision request={request} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Register>
      ) : null}
    </>
  );
}
