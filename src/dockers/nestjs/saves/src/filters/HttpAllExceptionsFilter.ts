import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { stat } from "fs";
import { httpControllerCatch } from "../utility/httpControllerCatch.js";

@Catch()
export class HttpAllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<FastifyReply>();
      const request = ctx.getRequest<FastifyRequest>();

      const transformException = httpControllerCatch(exception);
      const status = transformException.getStatus();
      const exceptionResponse = transformException.getResponse();

      const errBody = typeof exceptionResponse === 'object' && exceptionResponse !== null
      ? exceptionResponse
      : { message: exceptionResponse };

      response
        .status(status)
        .send({
          ...errBody,
          timestamp: new Date().toISOString(),
          path: request.url
        })
  }
}