import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Patch,
  Post,
  Query, // 1. Import Query instead of / in addition to Param
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { FriendshipStatus } from '../drizzle/schema/friendships.schema.js';
import { FriendService } from './friend.service.js';

@ApiTags('friendships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  getAllFriends(@Req() req: any) {
    return this.friendService.findAllFriendships(req.user.id);
  }

  // Route becomes: POST /friend/request?targetUserId=<uuid>
  @Post('request')
  @ApiQuery({ name: 'targetUserId', type: 'string', format: 'uuid' })
  makeFriendRequest(
    @Req() req: any,
    @Query('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.friendService.makeFriendRequest(req.user.id, targetUserId);
  }

  // Route becomes: PATCH /friend/accept?targetUserId=<uuid>
  @Patch('accept')
  @ApiQuery({ name: 'targetUserId', type: 'string', format: 'uuid' })
  acceptFriendRequest(
    @Req() req: any,
    @Query('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.friendService.setFriendshipStatus(
      req.user.id,
      targetUserId,
      FriendshipStatus.ACCEPTED,
    );
  }

  // Route becomes: PATCH /friend/reject?targetUserId=<uuid>
  @Patch('reject')
  @ApiQuery({ name: 'targetUserId', type: 'string', format: 'uuid' })
  rejectFriendRequest(
    @Req() req: any,
    @Query('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.friendService.setFriendshipStatus(
      req.user.id,
      targetUserId,
      FriendshipStatus.DECLINED,
    );
  }

  // Route becomes: POST /friend/block?targetUserId=<uuid>
  @Post('block')
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'targetUserId', type: 'string', format: 'uuid' })
  blockUser(
    @Req() req: any,
    @Query('targetUserId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.friendService.setFriendshipStatus(
      req.user.id,
      targetUserId,
      FriendshipStatus.BLOCKED,
    );
  }
}