import { PartialType, PickType} from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';


// FIX: must not be able to update email of the user
/*
    If want the user to be able to modify the email also
    we would need re-verify the new email that user needs
    to validate first
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
}
