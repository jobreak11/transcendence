import { HttpStatus, Logger } from "@nestjs/common"
import { logError } from "../../utility/logError.js"

export function logErrorRedisPipeLine(logger: Logger, functionName: string) {
    return logError(
      logger,
      `error from ${functionName}`,
      "redis pipeline error",
      HttpStatus.INTERNAL_SERVER_ERROR
    )
}

export function logErrorRedisError(logger: Logger, functionName: string, error?: any) {
    return logError(
      logger,
      `error from ${functionName}`,
      "redis error",
      HttpStatus.INTERNAL_SERVER_ERROR,
      error
    )
  }