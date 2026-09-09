"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import Image from "next/image";

interface UploadResponse {
  message?: string;
  url?: string;
  error?: string;
}

export default function ProfilePictureUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {


    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(selectedFile.type)) {
      setStatus({ type: "error", text: `Only JPG, JPEG, and PNG files are supported. (${e.type})` });
      return;
    }

    // Client-side MIME type check
    if (!selectedFile.type.startsWith("image/")) {
      setStatus({ type: "error", text: "Please select a valid image file." });
      return;
    }

    // Client-side size check (e.g., 5 MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setStatus({ type: "error", text: "File size must be under 5MB." });
      return;
    }

    setFile(selectedFile);
    setStatus(null);

    // Generate local preview URL
    const localUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(localUrl);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setStatus({ type: "error", text: "Please select an image first." });
      return;
    }

    setIsUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/user/profile/uploadProfilePic", {
        method: "POST",
        body: formData, // Browser sets the Content-Type to multipart/form-data automatically
      });

      const data: UploadResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus({ type: "success", text: data.message || "Profile picture updated!" });
    } catch (err) {
      setStatus({
        type: "error",
        text: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Profile preview"
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
            No image
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
      >
        Choose photo
      </button>

      {file && (
        <p className="max-w-50 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {file.name}
        </p>
      )}

      {status && (
        <p
          className={`text-xs font-medium ${
            status.type === "success" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {status.text}
        </p>
      )}

      <button
        type="submit"
        disabled={!file || isUploading}
        className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isUploading ? "Uploading..." : "Save Picture"}
      </button>
    </form>
  );
}