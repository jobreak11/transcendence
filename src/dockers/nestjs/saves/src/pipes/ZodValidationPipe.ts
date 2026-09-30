import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import { error } from "console";
import z from "zod";

export class ZodValidationPipe implements PipeTransform {

  constructor(private schema: z.ZodType) {}

  transform(value: any, metadata: ArgumentMetadata) {

    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validation Failed.",
        errors: z.treeifyError(result.error)
      });
    }

    return (result.data);
  }

}