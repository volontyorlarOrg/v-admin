import Image from "next/image";

import { storedVacancyImageUrl } from "@/lib/vacancies/image";

export function VacancyImage({ imageUrl, title }: { imageUrl: string; title: string }) {
  const storedImage = storedVacancyImageUrl(imageUrl);
  if (!storedImage) return null;

  return (
    <section className="panel-surface overflow-hidden rounded-xl border border-border/70">
      <h2 className="border-b border-border px-5 py-4 text-section font-semibold text-ink">
        {title}
      </h2>
      <div className="p-5">
        <Image
          unoptimized
          src={storedImage}
          alt=""
          width={640}
          height={360}
          className="aspect-video w-full max-w-lg rounded-lg object-cover"
        />
      </div>
    </section>
  );
}
