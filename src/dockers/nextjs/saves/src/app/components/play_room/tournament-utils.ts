export async function getErrorMessage(response: Response) {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object"
      && body !== null
      && "message" in body
      && typeof body.message === "string"
    ) {
      return body.message;
    }
  } catch {
    return `Request failed (${response.status}).`;
  }
  return `Request failed (${response.status}).`;
}
