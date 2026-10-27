import { HttpStatus, Logger } from "@nestjs/common";

// log error and return the Error object for throw
export function logError(
  logger: Logger,
  logMessage: string,
  errMessage: string,
  code: HttpStatus,
  error?: any
) {

  logger.error({
    message: logMessage,
    error: error ?? errMessage
  });

  return new Error(errMessage, {
    cause: {
      code: code,
      message: errMessage,
      error: error ?? ""
    }
  })
}