"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/api/action-result";

export type VacancyImageLabels = {
  title: string;
  description: string;
  choose: string;
  upload: string;
  replace: string;
  remove: string;
  pending: string;
  saved: string;
  removed: string;
  noImage: string;
  reviewNotice?: string;
  errors: Record<string, string>;
};

function storedImageUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function VacancyImage({
  id,
  imageUrl,
  editable,
  labels,
  uploadAction,
  removeAction,
}: {
  id: string;
  imageUrl?: string;
  editable: boolean;
  labels: VacancyImageLabels;
  uploadAction: (body: FormData) => Promise<ActionResult>;
  removeAction: (body: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const storedImage = storedImageUrl(imageUrl);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function showResult(result: ActionResult, success: string) {
    if (result.status === "ok") {
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      setMessage(success);
      setError(false);
      router.refresh();
      return;
    }
    if (result.status === "error") {
      setMessage(labels.errors[result.code] ?? labels.errors.server ?? result.code);
      setError(true);
    }
  }

  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage(
        labels.errors.opportunityImageFormatUnsupported ??
          labels.errors.server ??
          "Invalid image",
      );
      setError(true);
      return;
    }
    if (file.size > 2_097_152) {
      setMessage(
        labels.errors.opportunityImageTooLarge ??
          labels.errors.server ??
          "Image too large",
      );
      setError(true);
      return;
    }
    const body = new FormData();
    body.set("id", id);
    body.set("image", file);
    startTransition(async () => {
      try {
        showResult(await uploadAction(body), labels.saved);
      } catch {
        setMessage(labels.errors.server ?? labels.description);
        setError(true);
      }
    });
  }

  function remove() {
    const body = new FormData();
    body.set("id", id);
    startTransition(async () => {
      try {
        showResult(await removeAction(body), labels.removed);
      } catch {
        setMessage(labels.errors.server ?? labels.description);
        setError(true);
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 panel-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-section font-semibold text-ink">{labels.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{labels.description}</p>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-start">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-soft">
          {preview || storedImage ? (
            <Image
              unoptimized
              src={preview ?? storedImage ?? ""}
              alt=""
              width={640}
              height={360}
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center px-4 text-center text-sm text-ink-muted">
              {labels.noImage}
            </div>
          )}
        </div>
        {editable ? (
          <div className="flex min-w-0 flex-col gap-3">
            <form onSubmit={upload} className="flex flex-col gap-3">
              <label
                htmlFor={`vacancy-image-${id}`}
                className="text-sm font-medium text-ink"
              >
                {labels.choose}
              </label>
              <Input
                ref={inputRef}
                id={`vacancy-image-${id}`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={pending}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setFile(nextFile);
                  setPreview(nextFile ? URL.createObjectURL(nextFile) : null);
                  setMessage(null);
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={!file || pending}>
                  {pending ? labels.pending : imageUrl ? labels.replace : labels.upload}
                </Button>
                {imageUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={remove}
                  >
                    {labels.remove}
                  </Button>
                ) : null}
              </div>
            </form>
            {labels.reviewNotice ? (
              <p className="text-sm text-ink-muted">{labels.reviewNotice}</p>
            ) : null}
            {message ? (
              <p role={error ? "alert" : "status"} className="text-sm text-ink">
                {message}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
