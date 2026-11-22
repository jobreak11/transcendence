import { Controller, Get, UseFilters, UseGuards } from "@nestjs/common";
import { httpControllerCatch } from "../../utility/httpControllerCatch.js";
import { HttpAllExceptionsFilter } from "../filters/HttpAllExceptionsFilter.js";
import { IpThrottlerGuard } from "../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { PublicApiAuthGuard } from "../../modules/users-api/guards/public-api-auth.guard.js";
import { UserThrottlerGuard } from "../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { ApiOperation, ApiSecurity } from "@nestjs/swagger";

@Controller('public-api')
@UseGuards(IpThrottlerGuard, PublicApiAuthGuard, UserThrottlerGuard)
@ApiSecurity('x-api-key')
@UseFilters(HttpAllExceptionsFilter)
export class PublicController {

    @ApiOperation({
        summary: "test public api",
        description : "this endpoint is used for testing"
    })
    @Get()
    hello() {

        return "Hello world test test"
    }

}