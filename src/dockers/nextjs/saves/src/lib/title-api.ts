//one player can have many title

// export type UserTitle = {
//   name: string;
//   description: string;
//   titleId: string;
//   unlockedAt: string;
// };

// type ApiErrorResponse = {
//   message?: string | string[];
//   error?: string;
// };

// export class TitleApiError extends Error {
//   status: number;

//   constructor(
//     message: string,
//     status: number,
//   ) {
//     super(message);

//     this.name = "TitleApiError";
//     this.status = status;
//   }
// }

// async function createTitleApiError(
//   response: Response,
// ): Promise<TitleApiError> {
//   const data: ApiErrorResponse | null =
//     await response
//       .json()
//       .catch(() => null);

//   let message =
//     `Unable to load titles (${response.status}).`;

//   if (Array.isArray(data?.message)) {
//     message = data.message.join(", ");
//   } else if (
//     typeof data?.message === "string"
//   ) {
//     message = data.message;
//   } else if (
//     typeof data?.error === "string"
//   ) {
//     message = data.error;
//   }

//   return new TitleApiError(
//     message,
//     response.status,
//   );
// }

// function isUserTitle(
//   value: unknown,
// ): value is UserTitle {
//   if (
//     typeof value !== "object" ||
//     value === null
//   ) {
//     return false;
//   }

//   const title =
//     value as Record<string, unknown>;

//   return (
//     typeof title.name === "string" &&
//     typeof title.description ===
//       "string" &&
//     typeof title.titleId ===
//       "string" &&
//     typeof title.unlockedAt ===
//       "string"
//   );
// }

// export async function getMyTitles(
//   signal?: AbortSignal,
// ): Promise<UserTitle[]> {
//   const response = await fetch(
//     "/api/title",
//     {
//       method: "GET",
//       credentials: "include",
//       cache: "no-store",
//       signal,
//     },
//   );

//   if (!response.ok) {
//     throw await createTitleApiError(
//       response,
//     );
//   }

//   const data: unknown =
//     await response.json();

//   if (!Array.isArray(data)) {
//     throw new Error(
//       "The title API returned an invalid response.",
//     );
//   }

//   if (!data.every(isUserTitle)) {
//     throw new Error(
//       "The title API returned an invalid title.",
//     );
//   }

//   return data;
// }

// export function findTitleById(
//   titles: UserTitle[],
//   titleId?: string | null,
// ): UserTitle | null {
//   if (!titleId) {
//     return null;
//   }

//   return (
//     titles.find(
//       (title) =>
//         title.titleId === titleId,
//     ) ?? null
//   );
// }