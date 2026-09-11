import { PartialType, PickType, OmitType} from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';


const _BaseUpdateUserDto = PartialType(
  OmitType(CreateUserDto, ['email'] as const),
);

// FIXED: must not be able to update email of the user
/*
    If want the user to be able to modify the email also
    we would need re-verify the new email that user needs
    to validate first
 */
export class UpdateUserDto extends _BaseUpdateUserDto {}
