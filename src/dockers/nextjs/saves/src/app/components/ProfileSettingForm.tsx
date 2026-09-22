"use client";

import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Profile = {
  id: string;
  displayName: string;
  pronoun: string;
  title: string;
  signature: string;
  imageUrl: string;
};

type ProfileSettingFormProps = {
  initialProfile: Profile;
};

export default function ProfileSettingForm({
  initialProfile,
}: ProfileSettingFormProps) {
  const [formData, setFormData] = useState(initialProfile);
  const [previewUrl, setPreviewUrl] = useState(initialProfile.imageUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const generatedPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (generatedPreviewRef.current) {
        URL.revokeObjectURL(generatedPreviewRef.current);
      }
    };
  }, []);

  function updateField(field: keyof Profile, value: string) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (generatedPreviewRef.current) {
      URL.revokeObjectURL(generatedPreviewRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    generatedPreviewRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      // Replace this with real API request.
      // await fetch("/api/profile", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(formData),
      // });

      await new Promise((resolve) => setTimeout(resolve, 700));
      setMessage("Profile saved successfully.");
    } catch {
      setMessage("Unable to save the profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-sm border border-white/5 bg-zinc-700/90 p-5 shadow-2xl backdrop-blur-sm sm:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <section>
          <div className="relative aspect-square overflow-hidden bg-black">
            <Image
              src={previewUrl}
              alt={`${formData.displayName}'s profile`}
              fill
              priority
              unoptimized={previewUrl.startsWith("blob:")}
              className="object-cover"
            />

            <label
              htmlFor="profile-image"
              className="absolute bottom-4 right-4 flex size-14 cursor-pointer
                         items-center justify-center rounded-full bg-cyan-200
                         text-3xl text-zinc-800 shadow-lg transition
                         hover:scale-105 hover:bg-cyan-100
                         focus-within:ring-4 focus-within:ring-cyan-400/50"
              title="Change profile picture"
            >
              <span aria-hidden="true">⚙️</span>

              <span className="sr-only">Change profile picture</span>

              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>
          </div>
        </section>

        <section className="flex flex-col">
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            <ProfileField label="ID">
              <p className="min-h-12 py-2 text-xl sm:text-2xl">
                {formData.id}
              </p>
            </ProfileField>

            <ProfileField label="Display Name" htmlFor="displayName">
              <input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(event) =>
                  updateField("displayName", event.target.value)
                }
                className={inputStyles}
              />
            </ProfileField>

            <ProfileField label="Pronoun" htmlFor="pronoun">
              <select
                id="pronoun"
                value={formData.pronoun}
                onChange={(event) =>
                  updateField("pronoun", event.target.value)
                }
                className={inputStyles}
              >
                <option value="he/him">he/him</option>
                <option value="she/her">she/her</option>
                <option value="they/them">they/them</option>
                <option value="prefer-not-to-say">
                  Prefer not to say
                </option>
              </select>
            </ProfileField>

            <ProfileField label="Title" htmlFor="title">
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(event) =>
                  updateField("title", event.target.value)
                }
                className={inputStyles}
              />
            </ProfileField>
          </div>

          <div className="my-6 border-t border-zinc-400" />

          <ProfileField label="Signature" htmlFor="signature">
            <textarea
              id="signature"
              value={formData.signature}
              onChange={(event) =>
                updateField("signature", event.target.value)
              }
              rows={3}
              maxLength={160}
              className={`${inputStyles} resize-y`}
            />

            <p className="mt-1 text-right text-sm text-zinc-300">
              {formData.signature.length}/160
            </p>
          </ProfileField>

          <div className="mt-8 flex flex-col items-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="min-w-40 rounded-xl bg-red-600 px-8 py-3
                         text-xl font-bold text-white shadow-lg
                         transition hover:bg-red-500
                         focus:outline-none focus:ring-4
                         focus:ring-red-400/40 disabled:cursor-not-allowed
                         disabled:bg-red-900"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>

            <p
              aria-live="polite"
              className="min-h-6 text-sm text-zinc-200"
            >
              {message}
            </p>
          </div>
        </section>
      </div>
    </form>
  );
}

type ProfileFieldProps = {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
};

function ProfileField({
  label,
  htmlFor,
  children,
}: ProfileFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-lg font-medium text-white sm:text-xl"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

const inputStyles = `
  w-full rounded-md border border-zinc-500 bg-black px-4 py-2
  text-lg text-white outline-none transition
  placeholder:text-zinc-500
  focus:border-red-500 focus:ring-2 focus:ring-red-500/40
`;