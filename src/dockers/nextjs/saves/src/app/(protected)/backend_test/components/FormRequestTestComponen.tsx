'use client';

import { useState } from "react";
import { keyof } from "zod";

interface FormRequestTestComponentProps {
  method: string,
  name: string;
  apiPath: string;
  queryParams?: string[];
  requiredField?: string[];
  optionalField?: string[];
}

export function FormRequestTestComponent({
  method,
  name,
  apiPath,
  queryParams = [],
  requiredField = [],
  optionalField = [],
}: FormRequestTestComponentProps) {

  const [formData, setFormData] = useState<Record<string,string>>({});
  const [queryFormData, setQueryFormData] = useState<Record<string,string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleQueryInputChange = (fieldName: string, value: string) => {
    setQueryFormData((prev) => ({
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


    let requestUrl = apiPath;
    if (queryParams.length !== 0 && Object.values(queryFormData).length !== 0) {

      const stringtifyParam = Object.fromEntries(
        Object.entries(queryFormData).map(([key, value]) => [key, String(value)])
      );
      const searhParams = new URLSearchParams(stringtifyParam);
      requestUrl += `?${searhParams.toString()}`;
    }


    try {
      const res = await fetch(requestUrl, {
        method: method,
        
        headers: {
          "Content-Type": "application/json",
        },
        body: Object.entries(formData).length > 0 ? JSON.stringify(formData) : null,
      });

      setStatus(res.status);

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message || `Request failed with status ${res.status}`);
      }

      const stringData = JSON.stringify(json, null, 2);

      setResponse(stringData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occured");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="bg-slate-800 p-3 rounded-sm mb-6 w-full min-w-0 max-w-full">
      <h1 className="text-2xl mb-4">{name}</h1>

      <form onSubmit={handleSubmit}>

        {
          queryParams.length !== 0 && (
            <div>
              <h3 className="text-md font-semibold">Query Params</h3>
              {
                queryParams.map((field) => (

                  <div key={field} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-400">
                      {field} <span className="text-[10px] text-slate-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={queryFormData[field] || ""}
                      onChange={(e) => handleQueryInputChange(field, e.target.value)}
                      placeholder={`Enter ${field}`}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                ))
              }
            </div>
          )
        }

        {
        requiredField.length !== 0 &&
        (<div
        >
          <h3 className="text-md font-semibold">Required Field</h3>
          {
               requiredField.map((field) => (
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
            ))
          }
        </div>)
        }

        {optionalField.length !== 0 && (
          <div>
            <h3 className="text-2xl font-semibold">Optional Field</h3>
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
          </div>
        )}


        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed font-medium py-2 px-4 rounded text-sm transition mt-2"
        >
          {isLoading ? "Sending..." : `Send Request to ${apiPath}`}
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

      {response && (
        <div className="p-4 border rounded">
          <pre className="whitespace-pre-wrap break-all">
            {response}
          </pre>
        </div>
      )}
    
    
    </div>
  )
}