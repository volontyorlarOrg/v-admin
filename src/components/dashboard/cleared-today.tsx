import { getFormatter, getTranslations } from "next-intl/server";

import { Register, RegisterNote } from "@/components/register/register";
import { Seal, type SealTone } from "@/components/register/seal";
import { Link } from "@/i18n/navigation";
import { volunteerNameOf } from "@/lib/applications/filters";
import { sealDate } from "@/lib/datetime";
import { isFresh, type Cleared } from "@/lib/queue/dashboard";
import { applicationHref, vacancyHref } from "@/lib/routing/routes";

export async function ClearedToday({
  cleared,
  now,
}: {
  cleared: Cleared[];
  now: Date;
}) {
  const [t, seal, format] = await Promise.all([
    getTranslations("desk"),
    getTranslations("seal"),
    getFormatter(),
  ]);
  const issuer = seal("issuer");

  const mark = (item: Cleared): { word: string; tone: SealTone } => {
    if (item.kind === "rollCall") return { word: seal("recorded"), tone: "person" };
    if (item.kind === "vacancy") {
      return item.decision === "approved"
        ? { word: seal("approved"), tone: "institution" }
        : item.decision === "rejected"
          ? { word: seal("rejected"), tone: "neutral" }
          : { word: seal("returned"), tone: "neutral" };
    }
    return item.decision === "accepted"
      ? { word: seal("accepted"), tone: "person" }
      : item.decision === "closed"
        ? { word: seal("closed"), tone: "neutral" }
        : { word: seal("rejected"), tone: "neutral" };
  };

  const link = "hover:text-primary-ink hover:underline";

  return (
    <Register
      id="cleared"
      title={t("cleared.title")}
      count={cleared.length}
      countLabel={t("cleared.countLabel")}
    >
      {cleared.length === 0 ? (
        <RegisterNote title={t("cleared.empty")} />
      ) : (
        <ol className="divide-y divide-border">
          {cleared.map((item) => {
            const stamp = mark(item);
            const date = sealDate(item.at);
            const key =
              item.kind === "vacancy"
                ? `vacancy-${item.vacancy.id}`
                : item.kind === "application"
                  ? `application-${item.application.id}`
                  : `roll-${item.vacancyId}`;
            return (
              <li key={key} className="flex items-center gap-4 px-5 py-3">
                <Seal
                  word={stamp.word}
                  date={date}
                  issuer={issuer}
                  tone={stamp.tone}
                  fresh={isFresh(item.at, now)}
                  size={44}
                  label={seal("label", { word: stamp.word, date })}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold break-words text-ink">
                    {item.kind === "vacancy" ? (
                      <Link href={vacancyHref(item.vacancy.id)} className={link}>
                        {item.vacancy.title}
                      </Link>
                    ) : item.kind === "application" ? (
                      <Link
                        href={applicationHref(item.application.id)}
                        className={link}
                      >
                        {volunteerNameOf(item.application) || t("decide.unnamed")}
                      </Link>
                    ) : (
                      <Link href={vacancyHref(item.vacancyId)} className={link}>
                        {item.title}
                      </Link>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {item.kind === "vacancy"
                      ? t(`cleared.vacancy.${item.decision}`)
                      : item.kind === "application"
                        ? t("cleared.application", {
                            decision: t(`cleared.decision.${item.decision}`),
                            vacancy: item.application.opportunity?.title ?? "",
                          })
                        : t("cleared.rollCall", {
                            attended: item.attended,
                            other: item.other,
                          })}
                  </p>
                </div>
                <time
                  dateTime={item.at}
                  className="tabular shrink-0 text-sm text-ink-muted"
                >
                  {format.dateTime(new Date(item.at), "time")}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </Register>
  );
}
