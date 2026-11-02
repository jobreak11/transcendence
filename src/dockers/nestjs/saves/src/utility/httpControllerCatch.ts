import { ConflictException, HttpException, InternalServerErrorException, NotFoundException } from "@nestjs/common";


export function httpControllerCatch(error: any) {
    if (error instanceof HttpException) {
      return error;
    }

    if (error?.cause?.code) {
      const code: number = Number(error.cause.code);

      if (code === 23505) {
        return new ConflictException("row is already existed");
      }
      else if (code === 23503) {
        return new NotFoundException("foreign key not found");
      }

      const isValidHttpStatus = code >= 100 && code <= 599;
      if (isValidHttpStatus) {
        return new HttpException(
          {
            statusCode: code,
            message: error?.cause?.message ?? "Error",
            error: error?.cause?.error ?? null,
          },
          code,
          {
            cause: error?.cause ?? "none"
          }
        )
      }
      return new InternalServerErrorException(error?.cause.message ?? "unknown error");
    }

    return new InternalServerErrorException("unknown error");
}