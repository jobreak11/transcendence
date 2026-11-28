import { BadRequestException, Body, Controller, DefaultValuePipe, Delete, Get, HttpCode, HttpStatus, Logger, ParseIntPipe, ParseUUIDPipe, Patch, PayloadTooLargeException, Post, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { RolesGuard } from "../../../modules/auth/guards/roles/roles.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { InternalTrophiesService } from "./internal-trophies.service.js";
import { Roles } from "../../../modules/auth/decorators/roles.decorators.js";
import { Role } from "../../../modules/auth/enums/role.enum.js";
import { ZodValidationPipe } from "../../../pipes/ZodValidationPipe.js";
import { CreateNewTitleSchema } from "../../../modules/titles/title.dto.js";
import { CreateNewTrophyDto } from "./dtos/create-new-trophy.dto.js";
import { type AuthJwtFastifyRequest } from "../../../modules/auth/types/auth-jwtFastifyRequest.js";
import { relationExtrasToSQL } from "drizzle-orm";
import { GetTrophyDto } from "./dtos/get-trophy.dto.js";
import { TrophiesUpdateDto, trophiesUpdateSchema } from "../../../modules/trophies/database/dtos/trophies-update.dto.js";
import { NewUserTrophyDto } from "./dtos/new-user-trophy.dto.js";
import { TrophyDto } from "../../../infrastructure/drizzle/schema/throphies/trophies.dto.js";
import { optional } from "zod";

@ApiTags('Trophies')
@Controller('trophies/dev')
@UseFilters(HttpAllExceptionsFilter)
@Roles(Role.ADMIN, Role.DEVELOPER, Role.EDITOR)
@ApiBearerAuth()
@UseGuards(IpThrottlerGuard, JwtAuthGuard, RolesGuard, UserThrottlerGuard)
export class InternalTrophiesDeveloperController {

    private readonly logger = new Logger(InternalTrophiesDeveloperController.name);

    constructor(
        private readonly internalTrophiesService: InternalTrophiesService,
    ) {

    }

    // access all the trophies data
    @Get('all')
    allTrophies(
        @Req() req: any,
        @Query('limit', new ParseIntPipe({optional: true})) limit?: number,
        @Query('offset', new ParseIntPipe({optional: true})) offset?: number
    ): Promise<TrophyDto[]> {

        if ((limit && (limit < 0 || limit > 1000)) || (offset && offset < 0)) {
            throw new BadRequestException("invalid limit and offset range");
        }

        return this.internalTrophiesService.getAllTrophies(limit, offset);
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('create')
    createTrophy(
        @Req() req: any,
        @Body(new ZodValidationPipe(CreateNewTitleSchema)) body: CreateNewTrophyDto
    ) {
        return this.internalTrophiesService.createNewTrophy(body);
    }

    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({summary: 'Upload user profile picture'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Trophy image file (JPG)'
                },
            },
        },
    })
    @Post('uploadPic')
    async uploadTrophyPic(
        @Req() req: AuthJwtFastifyRequest,
        @Query('trophyId', ParseUUIDPipe) trophyId: string
    ): Promise<GetTrophyDto> {
        if (! req.isMultipart()) {
            throw new BadRequestException("Expected multipart/formdata")
        }

        const part = await req.file({
            limits: {
                fileSize: 1024 * 1024 * 10,
            },
        })

        if (!part) {
            throw new BadRequestException("File is required");
        }

        if (part.fieldname !== 'file') {
            part.file.resume();
            throw new BadRequestException("field name must be 'file'")
        }

        // const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        // if (!allowedMimeTypes.includes(part.mimetype)) {
        //     throw new BadRequestException("invalid file type to upload")
        // }

        const mimeToExt: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/svg+xml': 'svg',
        };
    
        const ext = mimeToExt[part.mimetype];
        if (!ext) {
          part.file.resume(); // Important: drain stream before throwing
          throw new BadRequestException(
            'Invalid file type. Only JPG, JPEG, PNG, and SVG are allowed',
          );
        }

        const buffer = await part.toBuffer();

        if (part.file.truncated) {
            throw new PayloadTooLargeException("file size exceeds the limit");
        }

        const res = await this.internalTrophiesService.uploadTropyPic(trophyId , buffer, ext);

        return {
            ...res
        }
    }

    @Patch('update')
    updateTrophyData(
        @Req() req: any,
        @Query('trophyId', ParseUUIDPipe) trophyId: string,
        @Body(new ZodValidationPipe(trophiesUpdateSchema)) body: TrophiesUpdateDto
    ): Promise<GetTrophyDto> {

        return this.internalTrophiesService.updateTrophy(trophyId, body);
    }

    @Post('give')
    giveUserTrophy(
        @Req() req: any,
        @Query('targetUserId', ParseUUIDPipe) targetUserId: string,
        @Query('targetTrophyId', ParseUUIDPipe) targetTrophyId: string
    ): Promise<NewUserTrophyDto> {

        return this.internalTrophiesService.giveUserTrophy(targetTrophyId, targetUserId)
    }


    @Delete('revoke')
    revokeUserTrophy(
        @Req() req: any,
        @Query('userId', ParseUUIDPipe) userId: string,
        @Query('trophyId', ParseUUIDPipe) trophyId: string
    ) {
        
        return this.internalTrophiesService.revokeUserTrophy(trophyId, userId);
    }

    @Delete('delete') 
    deleteUserTrophy(
        @Req() req: any,
        @Query('trophyId', ParseUUIDPipe) trophyId: string
    ) {
        return this.internalTrophiesService.deleteTrophy(trophyId);
    }

}