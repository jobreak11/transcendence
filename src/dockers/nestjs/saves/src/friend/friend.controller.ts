import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { FriendshipStatus } from '../drizzle/schema/friendships.schema.js';
import { FriendService } from './friend.service.js';

@ApiTags('friendships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Applies authentication to all routes in this controller
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  getAllFriends(@Req() req: any) {
    return this.friendService.findAllFriendships(req.user.id);
  }

  @Post('request/:targetUserId')
  makeFriendRequest(
    @Req() req: any,
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.friendService.makeFriendRequest(req.user.id, targetUserId);
  }

  @Patch('accept/:targetUserId')
  acceptFriendRequest(
    @Req() req: any,
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.friendService.setFriendshipStatus(
      req.user.id,
      targetUserId,
      FriendshipStatus.ACCEPTED,
    );
  }

  @Patch('reject/:targetUserId')
  rejectFriendRequest(
    @Req() req: any,
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.friendService.setFriendshipStatus(
      req.user.id,
      targetUserId,
      FriendshipStatus.DECLINED,
    );
  }

  @Post('block/:targetUserId')
  @HttpCode(HttpStatus.OK)
  blockUser(
    @Req() req: any,
    @Param('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.friendService.setFriendshipStatus(
      req.user.id,
      targetUserId,
      FriendshipStatus.BLOCKED,
    );
  }
}