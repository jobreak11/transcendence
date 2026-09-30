import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import {z, ZodError, ZodSchema} from "zod";

@Injectable()
export class WsZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodType) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body') {
      return value;
    }

    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new WsException({
        status: "error",
        message: "Validation Failed",
        errors: (result.error as ZodError).issues,
      });
    }
    return result.data;
  }
}