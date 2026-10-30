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

      return new HttpException(
        {
          status: code,
          error: error?.cause?.message ?? "",
        },
        code,
        {
          cause: error?.cause ?? "none"
        }
      );
    }

    return new InternalServerErrorException("unknown error");
}