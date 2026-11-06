"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  ChangeEvent,
  ComponentProps,
} from "react";

import ProfileImage from "./ProfileImage";

import {
  PRONOUN_OPTIONS,
  updateMyProfile,
  uploadProfilePicture,
  type PronounType,
  // type UpdateUserProfileRequest,
  type UserProfileUpdateFields,
  type UserProfileResponse,
} from "../../../lib/profile-api";

type AccountSettingsProps = {
  profile: UserProfileResponse;

  onSaved: (
    profile: UserProfileResponse,
  ) => void;
};

type ProfileDraft = {
  displayName: string;
  pronoun: PronounType | "";
  signature: string;
};

/*
 * Derive the submit event type directly from
 * React's <form> component.
 */
type FormSubmitHandler = NonNullable<
  ComponentProps<"form">["onSubmit"]
>;

function createDraft(
  profile: UserProfileResponse,
): ProfileDraft {
  return {
    displayName:
      profile.user_profile?.displayName ?? "",

    pronoun:
      profile.user_profile?.pronoun ?? "",

    signature:
      profile.user_profile?.signature ?? "",
  };
}

export default function AccountSettings({
  profile,
  onSaved,
}: AccountSettingsProps) {
  const [draft, setDraft] =
    useState<ProfileDraft>(() =>
      createDraft(profile),
    );

  const [message, setMessage] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const isBusy =
    isSaving || isUploading;

  /*
   * When ProfilePage receives new information from
   * the API, copy those values into the editable draft.
   */
  useEffect(() => {
    setDraft(createDraft(profile));
  }, [profile]);

  const handleSubmit: FormSubmitHandler =
    async (event) => {
      event.preventDefault();

      if (isBusy) {
        return;
      }

      const displayName =
        draft.displayName.trim();

      const signature =
        draft.signature.trim();

      if (displayName.length > 100) {
        setMessage(
          "Display name cannot exceed 100 characters.",
        );

        return;
      }

      if (signature.length > 100) {
        setMessage(
          "Signature cannot exceed 100 characters.",
        );

        return;
      }

      /*
       * Compare the draft with the original profile.
       * Only send properties that actually changed.
       */
      const originalDraft =
        createDraft(profile);

      const requestBody:
        UserProfileUpdateFields = {};

      if (
        displayName !==
        originalDraft.displayName.trim()
      ) {
        requestBody.displayName =
          displayName || null;
      }

      if (
        draft.pronoun !==
        originalDraft.pronoun
      ) {
        requestBody.pronoun =
          draft.pronoun || null;
      }

      if (
        signature !==
        originalDraft.signature.trim()
      ) {
        requestBody.signature =
          signature || null;
      }

      if (
        Object.keys(requestBody).length === 0
      ) {
        setMessage("No changes to save.");
        return;
      }

      setIsSaving(true);
      setMessage("");

      try {
        /*
         * In development, check the browser console
         * to confirm exactly what is being sent.
         */
        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.log(
            "Profile update request:",
            requestBody,
          );
        }

        const updatedProfile =
          await updateMyProfile(
            requestBody,
          );

        onSaved(updatedProfile);

        setMessage(
          "Changes saved successfully.",
        );
      } catch (error) {
        console.error(
          "Profile update failed:",
          error,
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to save changes.",
        );
      } finally {
        setIsSaving(false);
      }
    };

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file || isBusy) {
      return;
    }

    const acceptedImageTypes = [
      "image/png",
      "image/jpeg",
    ];

    if (
      !acceptedImageTypes.includes(file.type)
    ) {
      setMessage(
        "Please select a PNG, JPEG or JPG image.",
      );

      input.value = "";
      return;
    }

    const maximumFileSize =
      5 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      setMessage(
        "Profile picture must be smaller than 5 MB.",
      );

      input.value = "";
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const updatedProfile =
        await uploadProfilePicture(file);

      onSaved(updatedProfile);

      setMessage(
        "Profile picture updated successfully.",
      );
    } catch (error) {
      console.error(
        "Profile picture upload failed:",
        error,
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload profile picture.",
      );
    } finally {
      setIsUploading(false);

      /*
       * Allow the user to select the same file
       * again after a failed upload.
       */
      input.value = "";
    }
  }

  return (
    <section className="content active">
      <form
        className="blogbox profile-card"
        onSubmit={handleSubmit}
      >
        <div className="profile-image-editor">
          <ProfileImage
            className="large-profile-image"
            imageUrl={
              profile.user_profile?.avatarUrl
            }
          />

          <label
            htmlFor="profile-picture"
            className="profile-image-upload-button"
            title="Change profile picture"
            aria-disabled={isBusy}
          >
            <span aria-hidden="true">
              {isUploading ? "…" : "⚙"}
            </span>

            <span className="sr-only">
              {isUploading
                ? "Uploading profile picture"
                : "Change profile picture"}
            </span>

            <input
              id="profile-picture"
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="sr-only"
              disabled={isBusy}
              onChange={handleImageChange}
            />
          </label>
        </div>

        <div className="profile-details settings-details">
          <div className="settings-grid">
            <div>
              ID: {profile.tagId}
            </div>

            <label>
              Display Name:{" "}
              <input
                type="text"
                value={draft.displayName}
                maxLength={100}
                disabled={isBusy}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    displayName:
                      event.target.value,
                  }));

                  setMessage("");
                }}
              />
            </label>

            <label>
              Pronoun:{" "}
              <select
                value={draft.pronoun}
                disabled={isBusy}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    pronoun:
                      event.target.value as
                        | PronounType
                        | "",
                  }));

                  setMessage("");
                }}
              >
                <option value="">
                  Select pronoun
                </option>

                {PRONOUN_OPTIONS.map(
                  (pronoun) => (
                    <option
                      key={pronoun}
                      value={pronoun}
                    >
                      {pronoun}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div>
              Title:{" "}
              {profile.titleName ??
                "No active title"}
            </div>

            <div>
              Email: {profile.email}
            </div>
          </div>

          <br />

          <hr />

          <br />

          <label className="signature-field">
            Signature:{" "}
            <input
              type="text"
              value={draft.signature}
              maxLength={100}
              disabled={isBusy}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  signature:
                    event.target.value,
                }));

                setMessage("");
              }}
            />
          </label>

          <div className="save-row">
            <span
              aria-live="polite"
              role={
                message.includes("Unable") ||
                message.includes("failed")
                  ? "alert"
                  : "status"
              }
            >
              {message}
            </span>

            <button
              type="submit"
              className="red-button"
              disabled={isBusy}
            >
              {isSaving
                ? "Saving..."
                : "Save"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

// "use client";

// import { useState } from "react";
// import type { FormEvent } from "react";
// import ProfileImage from "./ProfileImage";
// import type { Profile } from "../../../lib/types";

// type AccountSettingsProps = {
//   profile: Profile;
//   onSave: (profile: Profile) => void;
// };

// export default function AccountSettings({
//   profile,
//   onSave,
// }: AccountSettingsProps) {
//   const [draft, setDraft] = useState(profile);
//   const [message, setMessage] = useState("");

//   function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     onSave(draft);
//     setMessage("Changes saved.");
//   }

//   return (
//     <section className="content active">
//       <form className="blogbox profile-card" onSubmit={handleSubmit}>
//         <ProfileImage className="large-profile-image" />
//         <div className="profile-details settings-details">
//           <div className="settings-grid">
//             <div>ID: {draft.id}</div>
//             <label>
//               Display Name:{" "}
//               <input
//                 value={draft.username}
//                 onChange={(event) =>
//                   setDraft({ ...draft, username: event.target.value })
//                 }
//               />
//             </label>
//             <label>
//               Pronoun:{" "}
//               <select
//                 value={draft.pronoun}
//                 onChange={(event) =>
//                   setDraft({
//                     ...draft,
//                     pronoun: event.target.value as Profile["pronoun"],
//                   })
//                 }
//               >
//                 <option value="he">He/Him</option>
//                 <option value="she">She/Her</option>
//                 <option value="they">They/Them</option>
//               </select>
//             </label>
//             <label>
//               Title:{" "}
//               <select
//                 value={draft.title}
//                 onChange={(event) =>
//                   setDraft({ ...draft, title: event.target.value })
//                 }
//               >
//                 <option>Poker Rookie</option>
//                 <option>DaveChips 888</option>
//                 <option>Dont@Me</option>
//               </select>
//             </label>
//           </div>
//           <br></br>
//           <hr />
//           <br></br>
//           <label className="signature-field">
//             Signature:{" "}
//             <input
//               value={draft.signature}
//               onChange={(event) =>
//                 setDraft({ ...draft, signature: event.target.value })
//               }
//             />
//           </label>
//           <div className="save-row">
//             <span aria-live="polite">{message}</span>
//             <button type="submit" className="red-button">
//               Save
//             </button>
//           </div>
//         </div>
//       </form>
//     </section>
//   );
// }



