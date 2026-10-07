"use client";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type Profile = {
  id: string;
  displayName: string;
  email: string;
  pronoun: string;
  title: string;
  signature: string;
  imageUrl: string;
};

type ApiProfile = {
  id?: string | number;
  displayName?: string;
  username?: string;
  name?: string;
  email?: string;
  pronoun?: string;
  title?: string;
  signature?: string;
  imageUrl?: string;
  image?: string;
  profilePicture?: string;
};

const emptyProfile: Profile = {
  id: "",
  displayName: "",
  email: "",
  pronoun: "",
  title: "",
  signature: "",
  imageUrl: "/669993.png",
};

export default function ProfileSettingForm() {
  const [formData, setFormData] =
    useState<Profile>(emptyProfile);

  const [previewUrl, setPreviewUrl] = useState(
    emptyProfile.imageUrl
  );

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  const generatedPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setHasError(false);
        setMessage("");

        const response = await fetch("/api/user/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.href =
            "/auth/signin?callbackUrl=/setting";
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to retrieve profile");
        }

        const result = await response.json();

        /*
         * This handles these possible response shapes:
         *
         * { id, email, ... }
         * { user: { id, email, ... } }
         * { data: { id, email, ... } }
         */
        const user: ApiProfile =
          result.data ?? result.user ?? result;

        const profile: Profile = {
          id: String(user.id ?? ""),
          displayName:
            user.displayName ??
            user.username ??
            user.name ??
            "",
          email: user.email ?? "",
          pronoun: user.pronoun ?? "",
          title: user.title ?? "",
          signature: user.signature ?? "",
          imageUrl:
            user.imageUrl ??
            user.profilePicture ??
            user.image ??
            "/669993.png",
        };

        setFormData(profile);
        setPreviewUrl(profile.imageUrl);
      } catch {
        setHasError(true);
        setMessage("Unable to load your profile.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (generatedPreviewRef.current) {
        URL.revokeObjectURL(generatedPreviewRef.current);
      }
    };
  }, []);

  function updateField(
    field: keyof Profile,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setHasError(false);
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setHasError(true);
      setMessage("Please select a valid image file.");
      return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
      setHasError(true);
      setMessage("The image must be smaller than 5 MB.");
      return;
    }

    if (generatedPreviewRef.current) {
      URL.revokeObjectURL(generatedPreviewRef.current);
    }

    const objectUrl = URL.createObjectURL(file);

    generatedPreviewRef.current = objectUrl;

    setSelectedImage(file);
    setPreviewUrl(objectUrl);
    setMessage("");
    setHasError(false);
  }

  async function uploadProfileImage(): Promise<string> {
    if (!selectedImage) {
      return formData.imageUrl;
    }

    const imageData = new FormData();

    // Change "file" if your API expects another field name.
    imageData.append("file", selectedImage);

    const response = await fetch(
      "/api/user/profile/uploadProfilePic",
      {
        method: "POST",
        credentials: "include",
        body: imageData,
      }
    );

    if (!response.ok) {
      throw new Error("Unable to upload profile picture");
    }

    const result = await response.json();

    return (
      result.imageUrl ??
      result.profilePicture ??
      result.url ??
      formData.imageUrl
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");
    setHasError(false);

    try {
      const imageUrl = await uploadProfileImage();

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          pronoun: formData.pronoun,
          title: formData.title,
          signature: formData.signature,
          imageUrl,
        }),
      });

      if (response.status === 401) {
        window.location.href =
          "/auth/signin?callbackUrl=/setting";
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to save profile");
      }

      setFormData((current) => ({
        ...current,
        imageUrl,
      }));

      setSelectedImage(null);
      setHasError(false);
      setMessage("Profile saved successfully.");
    } catch {
      setHasError(true);
      setMessage(
        "Unable to save your profile. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-sm border border-white/5 bg-zinc-700/90 p-8 text-center text-white shadow-2xl">
        Loading profile...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-sm border border-white/5 bg-zinc-700/90 p-5 shadow-2xl backdrop-blur-sm sm:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <section>
          <div className="relative aspect-square overflow-hidden bg-black">
            <img
              src={previewUrl}
              alt={
                formData.displayName
                  ? `${formData.displayName}'s profile`
                  : "Profile picture"
              }
              className="h-full w-full object-cover"
            />

            <label
              htmlFor="profile-image"
              title="Change profile picture"
              className="absolute bottom-4 right-4 flex size-14 cursor-pointer items-center justify-center rounded-full bg-cyan-200 text-3xl text-zinc-800 shadow-lg transition hover:scale-105 hover:bg-cyan-100 focus-within:ring-4 focus-within:ring-cyan-400/50"
            >
              <span aria-hidden="true">⚙️</span>

              <span className="sr-only">
                Change profile picture
              </span>

              <input
                id="profile-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>
          </div>

          <p className="mt-2 text-center text-xs text-zinc-300">
            PNG, JPEG or WebP. Maximum 5 MB.
          </p>
        </section>

        <section className="flex flex-col">
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            <ProfileField label="ID">
              <p className="min-h-12 break-all py-2 text-xl sm:text-2xl">
                {formData.id || "—"}
              </p>
            </ProfileField>

            <ProfileField
              label="Display Name"
              htmlFor="displayName"
            >
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={(event) =>
                  updateField(
                    "displayName",
                    event.target.value
                  )
                }
                className={inputStyles}
                required
              />
            </ProfileField>

            <ProfileField label="Email" htmlFor="email">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                readOnly
                className={`${inputStyles} cursor-not-allowed bg-zinc-900 text-zinc-400`}
              />
            </ProfileField>

            <ProfileField
              label="Pronoun"
              htmlFor="pronoun"
            >
              <select
                id="pronoun"
                name="pronoun"
                value={formData.pronoun}
                onChange={(event) =>
                  updateField("pronoun", event.target.value)
                }
                className={inputStyles}
              >
                <option value="">Select pronoun</option>
                <option value="he/him">he/him</option>
                <option value="she/her">she/her</option>
                <option value="they/them">they/them</option>
                <option value="prefer-not-to-say">
                  Prefer not to say
                </option>
              </select>
            </ProfileField>

            <div className="md:col-span-2">
              <ProfileField label="Title" htmlFor="title">
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={(event) =>
                    updateField("title", event.target.value)
                  }
                  className={inputStyles}
                  maxLength={80}
                />
              </ProfileField>
            </div>
          </div>

          <div className="my-6 border-t border-zinc-400" />

          <ProfileField
            label="Signature"
            htmlFor="signature"
          >
            <textarea
              id="signature"
              name="signature"
              value={formData.signature}
              onChange={(event) =>
                updateField(
                  "signature",
                  event.target.value
                )
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
              className="min-w-40 rounded-xl bg-red-600 px-8 py-3 text-xl font-bold text-white shadow-lg transition hover:bg-red-500 focus:outline-none focus:ring-4 focus:ring-red-400/40 disabled:cursor-not-allowed disabled:bg-red-900"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>

            <p
              aria-live="polite"
              className={`min-h-6 text-sm ${
                hasError
                  ? "text-red-300"
                  : "text-green-300"
              }`}
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
  children: ReactNode;
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

// "use client";

// import Image from "next/image";
// import {
//   ChangeEvent,
//   FormEvent,
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// type Profile = {
//   id: string;
//   displayName: string;
//   pronoun: string;
//   title: string;
//   signature: string;
//   imageUrl: string;
// };

// type ProfileSettingFormProps = {
//   initialProfile: Profile;
// };

// export default function ProfileSettingForm({
//   initialProfile,
// }: ProfileSettingFormProps) {
//   const [formData, setFormData] = useState(initialProfile);
//   const [previewUrl, setPreviewUrl] = useState(initialProfile.imageUrl);
//   const [isSaving, setIsSaving] = useState(false);
//   const [message, setMessage] = useState("");
//   const generatedPreviewRef = useRef<string | null>(null);

//   useEffect(() => {
//     return () => {
//       if (generatedPreviewRef.current) {
//         URL.revokeObjectURL(generatedPreviewRef.current);
//       }
//     };
//   }, []);

//   function updateField(field: keyof Profile, value: string) {
//     setFormData((current) => ({
//       ...current,
//       [field]: value,
//     }));

//     setMessage("");
//   }

//   function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
//     const file = event.target.files?.[0];

//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       setMessage("Please select an image file.");
//       return;
//     }

//     if (generatedPreviewRef.current) {
//       URL.revokeObjectURL(generatedPreviewRef.current);
//     }

//     const objectUrl = URL.createObjectURL(file);
//     generatedPreviewRef.current = objectUrl;
//     setPreviewUrl(objectUrl);
//     setMessage("");
//   }

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setIsSaving(true);
//     setMessage("");

//     try {
//       // Replace this with real API request.
//       // await fetch("/api/profile", {
//       //   method: "PUT",
//       //   headers: { "Content-Type": "application/json" },
//       //   body: JSON.stringify(formData),
//       // });

//       await new Promise((resolve) => setTimeout(resolve, 700));
//       setMessage("Profile saved successfully.");
//     } catch {
//       setMessage("Unable to save the profile. Please try again.");
//     } finally {
//       setIsSaving(false);
//     }
//   }

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="rounded-sm border border-white/5 bg-zinc-700/90 p-5 shadow-2xl backdrop-blur-sm sm:p-8"
//     >
//       <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
//         <section>
//           <div className="relative aspect-square overflow-hidden bg-black">
//             <Image
//               src={previewUrl}
//               alt={`${formData.displayName}'s profile`}
//               fill
//               priority
//               unoptimized={previewUrl.startsWith("blob:")}
//               className="object-cover"
//             />

//             <label
//               htmlFor="profile-image"
//               className="absolute bottom-4 right-4 flex size-14 cursor-pointer
//                          items-center justify-center rounded-full bg-cyan-200
//                          text-3xl text-zinc-800 shadow-lg transition
//                          hover:scale-105 hover:bg-cyan-100
//                          focus-within:ring-4 focus-within:ring-cyan-400/50"
//               title="Change profile picture"
//             >
//               <span aria-hidden="true">⚙️</span>

//               <span className="sr-only">Change profile picture</span>

//               <input
//                 id="profile-image"
//                 type="file"
//                 accept="image/*"
//                 onChange={handleImageChange}
//                 className="sr-only"
//               />
//             </label>
//           </div>
//         </section>

//         <section className="flex flex-col">
//           <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
//             <ProfileField label="ID">
//               <p className="min-h-12 py-2 text-xl sm:text-2xl">
//                 {formData.id}
//               </p>
//             </ProfileField>

//             <ProfileField label="Display Name" htmlFor="displayName">
//               <input
//                 id="displayName"
//                 type="text"
//                 value={formData.displayName}
//                 onChange={(event) =>
//                   updateField("displayName", event.target.value)
//                 }
//                 className={inputStyles}
//               />
//             </ProfileField>

//             <ProfileField label="Pronoun" htmlFor="pronoun">
//               <select
//                 id="pronoun"
//                 value={formData.pronoun}
//                 onChange={(event) =>
//                   updateField("pronoun", event.target.value)
//                 }
//                 className={inputStyles}
//               >
//                 <option value="he/him">he/him</option>
//                 <option value="she/her">she/her</option>
//                 <option value="they/them">they/them</option>
//                 <option value="prefer-not-to-say">
//                   Prefer not to say
//                 </option>
//               </select>
//             </ProfileField>

//             <ProfileField label="Title" htmlFor="title">
//               <input
//                 id="title"
//                 type="text"
//                 value={formData.title}
//                 onChange={(event) =>
//                   updateField("title", event.target.value)
//                 }
//                 className={inputStyles}
//               />
//             </ProfileField>
//           </div>

//           <div className="my-6 border-t border-zinc-400" />

//           <ProfileField label="Signature" htmlFor="signature">
//             <textarea
//               id="signature"
//               value={formData.signature}
//               onChange={(event) =>
//                 updateField("signature", event.target.value)
//               }
//               rows={3}
//               maxLength={160}
//               className={`${inputStyles} resize-y`}
//             />

//             <p className="mt-1 text-right text-sm text-zinc-300">
//               {formData.signature.length}/160
//             </p>
//           </ProfileField>

//           <div className="mt-8 flex flex-col items-end gap-3">
//             <button
//               type="submit"
//               disabled={isSaving}
//               className="min-w-40 rounded-xl bg-red-600 px-8 py-3
//                          text-xl font-bold text-white shadow-lg
//                          transition hover:bg-red-500
//                          focus:outline-none focus:ring-4
//                          focus:ring-red-400/40 disabled:cursor-not-allowed
//                          disabled:bg-red-900"
//             >
//               {isSaving ? "Saving..." : "Save"}
//             </button>

//             <p
//               aria-live="polite"
//               className="min-h-6 text-sm text-zinc-200"
//             >
//               {message}
//             </p>
//           </div>
//         </section>
//       </div>
//     </form>
//   );
// }

// type ProfileFieldProps = {
//   label: string;
//   htmlFor?: string;
//   children: React.ReactNode;
// };

// function ProfileField({
//   label,
//   htmlFor,
//   children,
// }: ProfileFieldProps) {
//   return (
//     <div>
//       <label
//         htmlFor={htmlFor}
//         className="mb-2 block text-lg font-medium text-white sm:text-xl"
//       >
//         {label}
//       </label>

//       {children}
//     </div>
//   );
// }

// const inputStyles = `
//   w-full rounded-md border border-zinc-500 bg-black px-4 py-2
//   text-lg text-white outline-none transition
//   placeholder:text-zinc-500
//   focus:border-red-500 focus:ring-2 focus:ring-red-500/40
// `;