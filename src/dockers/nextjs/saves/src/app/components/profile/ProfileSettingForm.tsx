"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { updateProfile, uploadProfilePicture } from "../../../lib/profile-api";
import { IS_DESIGN_PREVIEW } from "../../../lib/demo";
import { useProfile } from "./ProfileProvider";
import LoadingCard from "./LoadingCard";
import profile_sample from "../../../public/profile_sample.png"

export default function ProfileSettingForm() {
  const { profile, isLoading, error, setProfile, refreshProfile } = useProfile();
  const [formData, setFormData] = useState(profile);
  const [previewUrl, setPreviewUrl] = useState(profile.imageUrl);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    setFormData(profile);
    setPreviewUrl(profile.imageUrl);
  }, [profile]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  if (isLoading) return <LoadingCard message="Loading settings…" />;
  if (error) {
    return (
      <div className="bg-zinc-800/80 p-6 text-red-300">
        <p>{error}</p>
        <button type="button" onClick={() => void refreshProfile()} className="mt-4 rounded-md bg-red-600 px-4 py-2 font-bold">
          Try again
        </button>
      </div>
    );
  }

  function updateField(field: "displayName" | "pronoun" | "title" | "signature", value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setHasError(true);
      setMessage("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHasError(true);
      setMessage("The image must be smaller than 5 MB.");
      return;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(file);
    setSelectedImage(file);
    setPreviewUrl(previewRef.current);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setHasError(false);

    try {
      if (IS_DESIGN_PREVIEW) {
        setProfile((current) => ({
          ...current,
          displayName: formData.displayName,
          pronoun: formData.pronoun,
          title: formData.title,
          signature: formData.signature,
          imageUrl: previewUrl,
        }));
        setSelectedImage(null);
        setMessage("Design preview updated locally.");
        return;
      }

      const imageUrl = selectedImage ? await uploadProfilePicture(selectedImage) : formData.imageUrl;
      const saved = await updateProfile({
        displayName: formData.displayName,
        pronoun: formData.pronoun,
        title: formData.title,
        signature: formData.signature,
        imageUrl,
      });

      setProfile((current) => ({
        ...current,
        ...(saved ?? {}),
        displayName: saved?.displayName || formData.displayName,
        pronoun: saved?.pronoun ?? formData.pronoun,
        title: saved?.title || formData.title,
        signature: saved?.signature ?? formData.signature,
        imageUrl: saved?.imageUrl || imageUrl,
      }));
      setSelectedImage(null);
      setMessage("Profile saved successfully.");
    } catch (cause) {
      if (cause instanceof Error && cause.message === "UNAUTHORIZED") {
        window.location.assign("/auth/signin?callbackUrl=/setting");
        return;
      }
      setHasError(true);
      setMessage("Unable to save the profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-white/5 bg-zinc-700/90 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
      <div className="grid gap-7 lg:grid-cols-[minmax(220px,300px)_1fr]">
        <section>
          <div className="relative mx-auto aspect-square w-full max-w-[300px] overflow-hidden bg-black">
            <img src={profile_sample.src} alt={`${formData.displayName}'s profile`} className="h-full w-full object-cover" />
            <label htmlFor="profile-image" title="Change profile picture" className="absolute bottom-3 right-3 flex size-12 cursor-pointer items-center justify-center rounded-full bg-cyan-200 text-2xl text-zinc-800 shadow-lg transition hover:scale-105 hover:bg-cyan-100 focus-within:ring-4 focus-within:ring-cyan-400/50">
              <span aria-hidden="true">⚙️</span>
              <span className="sr-only">Change profile picture</span>
              <input id="profile-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="sr-only" />
            </label>
          </div>
          <p className="mt-2 text-center text-xs text-zinc-300">PNG, JPEG or WebP. Maximum 5 MB.</p>
        </section>

        <section className="flex min-w-0 flex-col">
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <ProfileField label="ID">
              <p className="min-h-11 break-all py-2 text-base sm:text-lg">{formData.id || "—"}</p>
            </ProfileField>
            <ProfileField label="Display Name" htmlFor="displayName">
              <input id="displayName" value={formData.displayName} onChange={(event) => updateField("displayName", event.target.value)} className={inputStyles} required maxLength={40} />
            </ProfileField>
            <ProfileField label="Email" htmlFor="email">
              <input id="email" type="email" value={formData.email} readOnly className={`${inputStyles} cursor-not-allowed bg-zinc-900 text-zinc-400`} />
            </ProfileField>
            <ProfileField label="Pronoun" htmlFor="pronoun">
              <select id="pronoun" value={formData.pronoun} onChange={(event) => updateField("pronoun", event.target.value)} className={inputStyles}>
                <option value="">Select pronoun</option>
                <option value="he/him">He/Him</option>
                <option value="she/her">She/Her</option>
                <option value="they/them">They/Them</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </ProfileField>
            <div className="md:col-span-2">
              <ProfileField label="Title" htmlFor="title">
                <input id="title" value={formData.title} onChange={(event) => updateField("title", event.target.value)} className={inputStyles} maxLength={80} />
              </ProfileField>
            </div>
          </div>

          <div className="my-5 border-t border-zinc-400" />
          <ProfileField label="Signature" htmlFor="signature">
            <textarea id="signature" value={formData.signature} onChange={(event) => updateField("signature", event.target.value)} rows={3} maxLength={160} className={`${inputStyles} resize-y`} />
            <p className="mt-1 text-right text-xs text-zinc-300">{formData.signature.length}/160</p>
          </ProfileField>

          <div className="mt-6 flex flex-col items-end gap-2">
            <button type="submit" disabled={isSaving} className="min-w-36 rounded-lg bg-red-600 px-7 py-2.5 text-lg font-bold text-white shadow-lg transition hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-400/40 disabled:cursor-not-allowed disabled:bg-red-900">
              {isSaving ? "Saving…" : "Save"}
            </button>
            <p aria-live="polite" className={`min-h-5 text-sm ${hasError ? "text-red-300" : "text-green-300"}`}>{message}</p>
          </div>
        </section>
      </div>
    </form>
  );
}

function ProfileField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-base font-medium text-white sm:text-lg">{label}</label>
      {children}
    </div>
  );
}

const inputStyles = "w-full rounded-md border border-zinc-500 bg-black px-3 py-2 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/40";
