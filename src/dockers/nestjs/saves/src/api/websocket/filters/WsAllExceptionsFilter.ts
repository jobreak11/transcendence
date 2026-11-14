import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

function wsGatewayCatch(error: any) {
  if (error instanceof WsException) {
    const response = error.getError();
    return typeof response === 'object' ? response : { message: response };
  }

  if (error instanceof HttpException) {
    return {
      statusCode: error.getStatus(),
      message: error.message
    }
  }

  if (error?.cause?.code) {
    const code = Number(error.cause.code);

    if (code === 23505) {
      return { statusCode : HttpStatus.CONFLICT, message: "row is already existed"}
    }
    else if (code === 23503) {
      return { statusCode: HttpStatus.NOT_FOUND, message: "foreign key not found"};
    }

    if (code >= 100 && code <= 599) {
      return {
        statusCode: code,
        message: error?.cause?.message ?? "error",
        error: error?.cause?.error ?? null
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: error?.cause?.message ?? "Database error",
    };
  }

  return {
    statusCode: 500,
    message: error?.message ?? "unknown error"
  }
}


@Catch()
export class WsAllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();
    const data = ctx.getData();

    const errorResponse = wsGatewayCatch(exception);

    client.emit('exception', {
      ...errorResponse,
      timestamp: new Date().toISOString(),
    })
  }
}