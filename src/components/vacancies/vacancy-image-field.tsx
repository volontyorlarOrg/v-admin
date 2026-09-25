"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  storedVacancyImageUrl,
  vacancyImageDimensionProblem,
  vacancyImageFileProblem,
} from "@/lib/vacancies/image";

export type VacancyImageFieldLabels = {
  title: string;
  description: string;
  choose: string;
  remove: string;
  undoRemove: string;
  noImage: string;
  errors: Record<string, string>;
};

function measure(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const probe = new window.Image();
    probe.onload = () =>
      resolve({ width: probe.naturalWidth, height: probe.naturalHeight });
    probe.onerror = () => resolve(null);
    probe.src = url;
  });
}

export function VacancyImageField({
  imageUrl,
  labels,
  error,
  idPrefix,
}: {
  imageUrl?: string;
  labels: VacancyImageFieldLabels;
  error?: string;
  idPrefix: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chosenRef = useRef<File | null>(null);
  const choiceRef = useRef(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const displayedImage = preview ?? (remove ? null : storedVacancyImageUrl(imageUrl));
  const message = localError ?? error;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    function keepChosenPhoto() {
      queueMicrotask(() => {
        const input = inputRef.current;
        const file = chosenRef.current;
        if (!input || !file || input.files?.length) return;
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
      });
    }
    form.addEventListener("reset", keepChosenPhoto);
    return () => form.removeEventListener("reset", keepChosenPhoto);
  }, []);

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const choice = ++choiceRef.current;
    chosenRef.current = null;
    setLocalError(null);
    setPreview(null);
    if (!file) return;

    const url = URL.createObjectURL(file);
    const code =
      vacancyImageFileProblem(file) ?? vacancyImageDimensionProblem(await measure(url));
    if (choice !== choiceRef.current) {
      URL.revokeObjectURL(url);
      return;
    }
    if (code) {
      URL.revokeObjectURL(url);
      input.value = "";
      setLocalError(labels.errors[code] ?? labels.errors.server ?? labels.choose);
      return;
    }
    chosenRef.current = file;
    setRemove(false);
    setPreview(url);
  }

  return (
    <section
      role="group"
      aria-labelledby={`${idPrefix}-image-title`}
      className="grid gap-4 border-t border-border px-5 py-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10"
    >
      <div className="min-w-0">
        <h2 id={`${idPrefix}-image-title`} className="text-section text-ink">
          {labels.title}
        </h2>
        <p
          id={`${idPrefix}-image-help`}
          className="mt-1 text-sm leading-relaxed text-ink-muted"
        >
          {labels.description}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-start">
        <div className="overflow-hidden rounded-lg border border-border bg-surface-soft">
          {displayedImage ? (
            <Image
              unoptimized
              src={displayedImage}
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
        <div className="flex min-w-0 flex-col gap-3">
          <Field invalid={Boolean(message)}>
            <FieldLabel htmlFor={`${idPrefix}-image`}>{labels.choose}</FieldLabel>
            <Input
              ref={inputRef}
              id={`${idPrefix}-image`}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="py-2 text-sm text-ink-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-surface-soft file:px-3 file:py-1 file:text-sm file:font-medium file:text-ink"
              aria-invalid={Boolean(message) || undefined}
              aria-describedby={`${idPrefix}-image-help${message ? ` ${idPrefix}-image-error` : ""}`}
              onChange={choose}
            />
            <FieldError id={`${idPrefix}-image-error`}>{message}</FieldError>
          </Field>
          {imageUrl ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                choiceRef.current += 1;
                chosenRef.current = null;
                setPreview(null);
                setLocalError(null);
                setRemove((current) => !current);
              }}
            >
              {remove ? labels.undoRemove : labels.remove}
            </Button>
          ) : null}
          {remove ? <input type="hidden" name="removeImage" value="on" /> : null}
        </div>
      </div>
    </section>
  );
}
