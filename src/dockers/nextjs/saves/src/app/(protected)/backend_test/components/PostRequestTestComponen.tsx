'use client';

import { useState } from "react";

interface PostFormRequestTestComponentProps {
  name: string;
  apiPath: string;
  requiredField?: string[];
  optionalField?: string[];
}

export function PostFormRequestTestComponent({
  name,
  apiPath,
  requiredField = [],
  optionalField = [],
}: PostFormRequestTestComponentProps) {

  const [formData, setFormData] = useState<Record<string,string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setResponse(null);
    setStatus(null);

    for (const field of requiredField) {
      if (!formData[field] || formData[field].trim() === "") {
        setError(`"${field}" is required.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      setStatus(res.status);

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || `Request failed with status ${res.status}`);
      }

      setResponse(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occured");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="bg-slate-800 p-3 rounded-sm mb-6">
      <h1 className="text-2xl">{name}</h1>

      <form onSubmit={handleSubmit}>
        {requiredField.map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              {field} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData[field] || ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={`Enter ${field}`}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        ))}

        {optionalField.map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-400">
              {field} <span className="text-[10px] text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={formData[field] || ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={`Enter ${field}`}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed font-medium py-2 px-4 rounded text-sm transition mt-2"
        >
          {isLoading ? "Sending..." : "Send Request"}
        </button>

      </form>

      {error && (
        <div
        className="mt-4 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded text-xs"
        >
          <p className="font-semibold">Error {status ? `(${status})` : ""}</p>
          <p className="mt-1">{error}</p>
        </div>
      )}
    </div>
  )
}