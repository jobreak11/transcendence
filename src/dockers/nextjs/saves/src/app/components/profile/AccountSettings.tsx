"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  ChangeEvent,
  SubmitEvent,
} from "react";

import ProfileImage from "./ProfileImage";

import {
  PRONOUN_OPTIONS,
  updateMyProfile,
  uploadProfilePicture,
  type PronounType,
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

  /*
   * When the parent receives updated profile data,
   * reset the draft with the latest values.
   */
  useEffect(() => {
    setDraft(createDraft(profile));
  }, [profile]);

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");

    try {
      const updatedProfile =
        await updateMyProfile({
          displayName:
            draft.displayName.trim() || null,

          pronoun:
            draft.pronoun || null,

          signature:
            draft.signature.trim() || null,
        });

      onSaved(updatedProfile);
      setMessage("Changes saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save changes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Please select a valid image file.",
      );

      event.target.value = "";
      return;
    }

    // Optional frontend limit: 5 MB.
    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Profile picture must be smaller than 5 MB.",
      );

      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      const updatedProfile =
        await uploadProfilePicture(file);

      onSaved(updatedProfile);

      setMessage(
        "Profile picture updated.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload profile picture.",
      );
    } finally {
      setIsUploading(false);

      // Allows the same image to be selected again.
      event.target.value = "";
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
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={isUploading}
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
                value={draft.displayName}
                maxLength={100}
                disabled={isSaving}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    displayName:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Pronoun:{" "}
              <select
                value={draft.pronoun}
                disabled={isSaving}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    pronoun:
                      event.target.value as
                        | PronounType
                        | "",
                  })
                }
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
              value={draft.signature}
              maxLength={100}
              disabled={isSaving}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  signature:
                    event.target.value,
                })
              }
            />
          </label>

          <div className="save-row">
            <span aria-live="polite">
              {message}
            </span>

            <button
              type="submit"
              className="red-button"
              disabled={
                isSaving || isUploading
              }
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



