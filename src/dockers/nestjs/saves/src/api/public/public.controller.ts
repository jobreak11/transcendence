import { Controller, Get } from "@nestjs/common";

@Controller('public')
export class PublicController {

    @Get()
    hello() {
        return "Hello world test test"
    }

}