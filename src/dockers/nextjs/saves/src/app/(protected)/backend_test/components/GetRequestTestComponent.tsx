'use client';

import { useEffect, useState } from "react";

export function GetRequestTestComponent(
  {
    name,
    apiPath,
  } :
  {
    name: string,
    apiPath: string
  }
) {

  const [returnData, setReturnData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(apiPath);

      if (!res.ok) {
        throw new Error(`Failed to fetch from ${apiPath}: ${res.statusText}`);
      }

      const data = await res.json();
      const stringData = JSON.stringify(data, null, 2);
      setReturnData(stringData);
    }
    catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-slate-800 p-3 rounded-sm mb-6">
      <h1 className="text-2xl">{name}</h1>
      <button onClick={handleClick}
      disabled={isLoading}
      className="p-3 m-2 bg-slate-700 rounded-4xl "
      >
        {isLoading ? 'Fetching...' : `Fire Get Request to api ${apiPath}`}
      </button>
       {error && <p className="text-red-500">Error: {error}</p>}

       {returnData && (
        <div className="p-4 border rounded">
          <pre className="whitespace-pre-wrap break-all">{returnData}</pre>
          <small className="text-gray-500">test</small>
        </div>
       )}
    </div>
  )
}