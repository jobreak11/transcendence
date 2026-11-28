import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Logger, ParseUUIDPipe, Patch, Post, Query, Req, UseFilters, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../modules/auth/guards/jwt-auth/jwt-auth.guard.js";
import { UserThrottlerGuard } from "../../../modules/auth/guards/user-throttler/user-throttler.guard.js";
import { HttpAllExceptionsFilter } from "../../filters/HttpAllExceptionsFilter.js";
import { Throttle } from "@nestjs/throttler";
import { THROTTLER_FRIEND_CONTROLLER_LIMIT, THROTTLER_FRIEND_CONTROLLER_TTL } from "./internal-friends.constants.js";
import { FriendService } from "../../../modules/friend/friend.service.js";
import { FriendshipStatus } from "../../../infrastructure/drizzle/schema/friendships.schema.js";
import { IpThrottlerGuard } from "../../../modules/auth/guards/ip-throttler/ip-throttler.guard.js";
import { UserService } from "../../../modules/user/user.service.js";


@ApiTags('friendships')
@ApiBearerAuth()
@UseGuards(IpThrottlerGuard, JwtAuthGuard, UserThrottlerGuard)
@UseFilters(HttpAllExceptionsFilter)
@Throttle({
  ip: {
    limit: THROTTLER_FRIEND_CONTROLLER_LIMIT,
    ttl: THROTTLER_FRIEND_CONTROLLER_TTL
  }
})
@Controller('friend')
export class InternalFriendsController {
  
  private readonly logger = new Logger(InternalFriendsController.name);

  constructor(
    private readonly friendService: FriendService,
    private readonly userService: UserService
  ) {}

  @Get()
  getAllFriends(@Req() req: any) {
    return this.friendService.findAllFriendships(req.user.id);
  }

  // Route becomes: POST /friend/request?targetUserId=<uuid>
  @Post('request')
  async makeFriendRequest(
    @Req() req: any,
    @Query('targetUserId', new ParseUUIDPipe({optional: true})) targetUserId?: string,
    @Query('targetTagId') targetTagId?: string
  ) {

    if ((targetTagId && targetUserId) || (!targetTagId && !targetUserId)) {
      throw new BadRequestException("invalid query param");
    }

    
    if (targetTagId) {

      const found = await this.userService.findByTagId(targetTagId);

      return this.friendService.makeFriendRequest(req.user.id, found.id);
    }
    else if (targetUserId) {
      return this.friendService.makeFriendRequest(req.user.id, targetUserId);
    }
  }

  // Route becomes: PATCH /friend/accept?targetUserId=<uuid>
  @Patch('accept')
  async acceptFriendRequest(
    @Req() req: any,
    @Query('targetUserId', new ParseUUIDPipe({optional: true})) targetUserId?: string,
    @Query('targetTagId') targetTagId?: string
  ) {

    if ((targetTagId && targetUserId) || (!targetTagId && !targetUserId)) {
      throw new BadRequestException("invalid query param");
    }

    if (targetUserId) {
      return this.friendService.setFriendshipStatus(
        req.user.id,
        targetUserId,
        FriendshipStatus.ACCEPTED,
      );
    }
    else if (targetTagId) {

      const found = await this.userService.findByTagId(targetTagId);

      return this.friendService.setFriendshipStatus(
        req.user.id,
        found.id,
        FriendshipStatus.ACCEPTED,
      );

    }

  }

  // Route becomes: PATCH /friend/reject?targetUserId=<uuid>
  @Patch('reject')
  async rejectFriendRequest(
    @Req() req: any,
    @Query('targetUserId', new ParseUUIDPipe({optional: true})) targetUserId?: string,
    @Query('targetTagId') targetTagId?: string
  ) {

    if ((targetTagId && targetUserId) || (!targetTagId && !targetUserId)) {
      throw new BadRequestException("invalid query param");
    }

    if (targetUserId) {
      return this.friendService.setFriendshipStatus(
        req.user.id,
        targetUserId,
        FriendshipStatus.DECLINED,
      );
    }
    else if (targetTagId) {

      const found = await this.userService.findByTagId(targetTagId);

      return this.friendService.setFriendshipStatus(
        req.user.id,
        found.id,
        FriendshipStatus.DECLINED,
      );
    }
 
  }

  // Route becomes: POST /friend/block?targetUserId=<uuid>
  @Post('block')
  @HttpCode(HttpStatus.OK)
  async blockUser(
    @Req() req: any,
    @Query('targetUserId', new ParseUUIDPipe({optional: true})) targetUserId?: string,
    @Query('targetTagId') targetTagId?: string
  ) {

    if ((targetTagId && targetUserId) || (!targetTagId && !targetUserId)) {
      throw new BadRequestException("invalid query param");
    }

    if (targetUserId) {
      return this.friendService.setFriendshipStatus(
        req.user.id,
        targetUserId,
        FriendshipStatus.BLOCKED,
      );
    }
    else if (targetTagId) {
      const found = await this.userService.findByTagId(targetTagId);

      return this.friendService.setFriendshipStatus(
        req.user.id,
        found.id,
        FriendshipStatus.BLOCKED,
      );
    }

  }

}