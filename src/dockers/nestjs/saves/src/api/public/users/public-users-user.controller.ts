import { Controller, Logger } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PublicUsersService } from "./public-users.service.js";

@ApiTags('Users API')
@Controller('public-api/users')
export class PublicUsersUserController {

    private readonly logger = new Logger(PublicUsersUserController.name);

    constructor(
        private readonly publicUsersService: PublicUsersService
    ) {

    }



}