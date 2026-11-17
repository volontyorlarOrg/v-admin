import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Panel } from "@/components/portal/panel";
import { LoadFailure } from "@/components/states/load-failure";
import { PageHeader } from "@/components/states/page-header";
import { VerificationForm } from "@/components/verification/verification-form";
import { failureOf, isReady } from "@/lib/api/load";
import { loadOrganizations } from "@/lib/organizations/data.server";
import { navHref } from "@/lib/routing/routes";
import { loadUser } from "@/lib/users/data.server";
import { loadVerification } from "@/lib/verification/data.server";

export const dynamic = "force-dynamic";

export default async function VerificationUserPage({
  params,
}: PageProps<"/[locale]/verification/[id]">) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [t, common, user, verification, organizations] = await Promise.all([
    getTranslations("verification"),
    getTranslations("common"),
    loadUser(id),
    loadVerification(id),
    loadOrganizations(),
  ]);
  const back = { href: navHref("verification"), label: t("title") };
  const failure =
    failureOf(user) ?? failureOf(verification) ?? failureOf(organizations);
  if (failure)
    return (
      <>
        <PageHeader back={back} title={t("title")} />
        <LoadFailure failure={failure} />
      </>
    );
  if (!isReady(user) || !isReady(verification) || !isReady(organizations)) notFound();
  return (
    <>
      <PageHeader
        back={back}
        title={user.data.displayName ?? common("notSet")}
        description={t("editHelp")}
      />
      <Panel id="verification" title={t("title")}>
        <VerificationForm
          id={id}
          verified={verification.data.verified}
          organizationId={verification.data.organization?.id ?? null}
          organizations={organizations.data}
          labels={{
            verified: t("verified"),
            organization: t("organization"),
            none: t("none"),
            save: t("save"),
            saving: t("saving"),
            success: t("success"),
            error: t("error"),
          }}
        />
      </Panel>
    </>
  );
}
