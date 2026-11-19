import { BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Logger, NotImplementedException, ParseIntPipe, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiForbiddenResponse, ApiNoContentResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { Roles } from "../../../modules/auth/decorators/roles.decorators.js";
import { Role } from "../../../modules/auth/enums/role.enum.js";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { THROTTLER_USER_ALLCOUNT_LIMIT, THROTTLER_USER_ALLCOUNT_TTL, THROTTLER_USER_BATCH_LIMIT, THROTTLER_USER_BATCH_TTL, THROTTLER_USER_SET_ROLE_LIMIT, THROTTLER_USER_SET_ROLE_TTL, USER_SERVICE_PAGE_LIMIT_MAX } from "./internal-users.constants.js";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { RolesGuard } from "../../../modules/auth/guards/roles/roles.guard.js";
import { ZodValidationPipe } from "../../../pipes/ZodValidationPipe.js";
import { UserSetRoleDto, userSetRoleSchema } from "../../../modules/user/dto/set-role-user.dto.js";
import { UserService } from "../../../modules/user/user.service.js";
import { CreateUserDto, createUserSchema } from "../../../modules/user/dto/create-user.dto.js";
import { UnauthorizedErrorDto } from "../../../modules/auth/dto/login.dto.js";
import { UserAndProfileDto } from "../../../modules/user/dto/user-and-profile.dto.js";
import { GetUserTotalCountDto } from "./dtos/get-user-count.dto.js";
import { InternalUsersService } from "./internal-users.service.js";


@ApiTags("Users")
@Controller('user/dev')
export class InternalUsersDeveloperController {

    private readonly logger = new Logger(InternalUsersDeveloperController.name);

    constructor (
        private readonly userService: UserService,
        private readonly internalUsersService: InternalUsersService
    ) {

    }

  @ApiOperation({
    summary: "set the role of the user"
  })
  @Roles(Role.ADMIN)
  @Throttle({
    default: {
      limit : THROTTLER_USER_SET_ROLE_LIMIT,
      ttl: THROTTLER_USER_SET_ROLE_TTL
    }
  })
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  @Post('setRole')
  async setUserRole(
    @Req() req: any,
    @Body(new ZodValidationPipe(userSetRoleSchema)) body: UserSetRoleDto
  ) {

    // Rules

    // 1. you cannot change the role of yourself
    if (req.user.id === body.userId) {
      throw new ForbiddenException("cannot set new role for yourself")
    }

    // cannot set other role to admin
    if (body.newRole === Role.ADMIN) {
      throw new ForbiddenException("cannot set other user to admin, should have only one admin")
    }

    if (body.newRole === Role.DEVELOPER || body.newRole === Role.GUEST ) {
        throw new NotImplementedException("DEVELOPER and GUEST role are not implemented yet")
    }

    const targetUser = await this.userService.findOne(body.userId);
    const setterUser = await this.userService.findOne(req.user.id);

    // ADMIN
    // EDITOR ( aka dev )
    // USER

    return this.userService.setRole(body.userId, body.newRole);
  }


  @ApiOperation({
    summary: 'Register a new user account',
    description: `register new user api for ADMIN role`
  })
  @ApiResponse({status: 201, description: 'User created successfully'})
  @ApiResponse({status: 401, description: 'validation failed.', type: UnauthorizedErrorDto})
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('create')
  async create(
    @Req() req: any,
    @Body(new ZodValidationPipe(createUserSchema)) createUserDto: CreateUserDto
  ) {
    const result = await this.userService.create(createUserDto);

    await this.internalUsersService.giveUserDefaultTitle(result.id);

    return result;
  }

  @ApiOperation({
    summary: `Delete user from the database`,
    description: `takes access_token from Authorization: Bearer header \
    and allow only role ${Role.ADMIN} and ${Role.EDITOR} to delete user
    `
  })
  @ApiUnauthorizedResponse({
    type: UnauthorizedErrorDto,
    description: 'invalid role, invalid Token, or expired Token'
  })
  @ApiNoContentResponse({
    description: 'successfully deleted'
  })
  @ApiForbiddenResponse({
    description: 'invalid role?'
  })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(Role.EDITOR, Role.ADMIN)
  @Throttle({
    default: {
      ttl: 10_000,
      limit: 20
    }
  })
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  //@UseGuards(JwtAuthGuard)
  @Delete('delete')
  async remove(
    @Req() req: any,
    @Query('userId', ParseUUIDPipe) userId: string
  ) {

    if (userId === req.user.id) {
      throw new ConflictException("cannot delete youeself user");
    }

    const [user, removerUser] = await Promise.all([
      this.userService.findOne(userId),
      this.userService.findOne(req.user.id),
    ])

    if (removerUser.role !== Role.ADMIN && user.role !== Role.USER) {
      // cannot remove

      throw new ForbiddenException("only ADMIN can remove account role higher than user")
    }

    this.logger.debug(`api reached user id to remove is ${userId}`)
    return this.userService.remove(userId);
  }

  @ApiOperation({
    summary: "get multiple user info",
    description: "for ADMIN AND EDITOR"
  })
  @Get()
  @Throttle({
    default: {
      limit: THROTTLER_USER_BATCH_LIMIT,
      ttl: THROTTLER_USER_BATCH_TTL
    }
  })
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  getBatchUsers(
    @Req() req: any,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('offset', ParseIntPipe) offset: number,
  ): Promise<UserAndProfileDto[]> {
    if (limit < 1 || offset < 0 || limit > USER_SERVICE_PAGE_LIMIT_MAX) {
      throw new BadRequestException("invalid query values");
    }
    return this.userService.getUsers(limit, offset)
  }

  // count overall user
  @Get('totalCount')
  @Throttle({
    default: {
      limit: THROTTLER_USER_ALLCOUNT_LIMIT,
      ttl: THROTTLER_USER_ALLCOUNT_TTL
    }
  })
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
  async totalUserCount(
    @Req() req:any,
  ): Promise<GetUserTotalCountDto> {

    const total = await this.userService.allUserCount();

    return {
      totalUserCount: total
    }
  }


}