import { HttpStatus } from "@nestjs/common";

export function errorWithCode(code: HttpStatus, errMessage?: string, error?: any) {
  return new Error(errMessage, {
    cause: {
      code: code,
      message: errMessage,
      error: error
    }
  })
}