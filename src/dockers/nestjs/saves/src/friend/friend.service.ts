import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type { DrizzleDB } from '../drizzle/types/drizzle.js';
import { friendships, FriendshipStatus } from '../drizzle/schema/friendships.schema.js';
import { and, eq, or } from 'drizzle-orm';

@Injectable()
export class FriendService {

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB
  ) {}

  async findAllFriendships(userId: string) {
    const records = await this.db
      .select()
      .from(friendships)
      .where(or(eq(friendships.requesterUserId, userId),
        eq(friendships.addresseeUserId, userId)))

    const sentRequests: {userId: string; status: FriendshipStatus; createdAt: Date }[] = [];
    const receivedRequests: typeof sentRequests = [];
    const acceptedFriends: typeof sentRequests = []

    for (const record of records) {
      if (record.status === FriendshipStatus.ACCEPTED) {
        acceptedFriends.push({
          userId: record.requesterUserId === userId ? record.addresseeUserId : record.requesterUserId,
          status: record.status,
          createdAt: record.createdAt
        })
      }
      else if (record.status === FriendshipStatus.PENDING) {
        if (record.requesterUserId === userId) {
          sentRequests.push({
            userId: record.addresseeUserId,
            status: record.status,
            createdAt: record.createdAt
          })
        }
        else {
          receivedRequests.push({
            userId: record.requesterUserId,
            status: record.status,
            createdAt: record.createdAt
          })
        }
      }
    }

    return {
      sentRequests,
      receivedRequests,
      acceptedFriends
    }
  }

  async setFriendshipStatus(
    currentUserId: string,
    targetUserId: string,
    status: FriendshipStatus,
  ) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot perform this action on yourself');
    }

    if (status === FriendshipStatus.PENDING) {
      throw new BadRequestException('Use makeFriendRequest to initiate a request');
    }

    // Find any existing relationship in either direction
    const [existing] = await this.db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterUserId, currentUserId),
            eq(friendships.addresseeUserId, targetUserId),
          ),
          and(
            eq(friendships.requesterUserId, targetUserId),
            eq(friendships.addresseeUserId, currentUserId),
          ),
        ),
      )
      .limit(1);

    // 1. BLOCKING: Can block regardless of whether a record currently exists
    if (status === FriendshipStatus.BLOCKED) {
      if (existing) {
        // Overwrite existing record: blocker becomes requester, blocked becomes addressee
        const [blocked] = await this.db
          .update(friendships)
          .set({
            requesterUserId: currentUserId,
            addresseeUserId: targetUserId,
            status: FriendshipStatus.BLOCKED,
          })
          .where(
            and(
              eq(friendships.requesterUserId, existing.requesterUserId),
              eq(friendships.addresseeUserId, existing.addresseeUserId),
            ),
          )
          .returning();

        return blocked;
      }

      // No prior relationship existed, create a new blocked entry
      const [newBlock] = await this.db
        .insert(friendships)
        .values({
          requesterUserId: currentUserId,
          addresseeUserId: targetUserId,
          status: FriendshipStatus.BLOCKED,
        })
        .returning();

      return newBlock;
    }

    // 2. ACCEPTING & DECLINING: Requires an existing PENDING request
    if (!existing) {
      throw new NotFoundException('No friend request found between these users');
    }

    if (existing.status === FriendshipStatus.BLOCKED) {
      throw new ForbiddenException('Cannot perform this action');
    }

    if (existing.status === FriendshipStatus.ACCEPTED) {
      throw new ConflictException('You are already friends with this user');
    }

    if (existing.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${status}`);
    }

    // Only the user who RECEIVED the request (addressee) can accept or decline it
    if (existing.addresseeUserId !== currentUserId) {
      throw new ForbiddenException(
        'Only the recipient of a friend request can accept or decline it',
      );
    }

    const [updated] = await this.db
      .update(friendships)
      .set({ status })
      .where(
        and(
          eq(friendships.requesterUserId, existing.requesterUserId),
          eq(friendships.addresseeUserId, existing.addresseeUserId),
        ),
      )
      .returning();

    return updated;
  }


  async makeFriendRequest(requesterUserId: string, addresseeUserId: string) {
    if (requesterUserId === addresseeUserId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const [existing] = await this.db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterUserId, requesterUserId),
            eq(friendships.addresseeUserId, addresseeUserId),
          ),
          and(
            eq(friendships.requesterUserId, addresseeUserId),
            eq(friendships.addresseeUserId, requesterUserId),
          ),
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.status === FriendshipStatus.BLOCKED ) {
        throw new ForbiddenException('Cannot Perform This Action.');
      }

      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Already friends with this user');
      }

      if (existing.status === FriendshipStatus.PENDING) {
        if (existing.requesterUserId === requesterUserId) {
          throw new ConflictException('Friend Request is already Sent and pending');
        } else {
          throw new ConflictException('This user has already sent you a friend request');
        }
      }

      if (existing.status === FriendshipStatus.DECLINED) {
        const [updated] = await this.db
          .update(friendships)
          .set({
            requesterUserId: requesterUserId,
            addresseeUserId: addresseeUserId,
            status: FriendshipStatus.PENDING,
            createdAt: new Date(),
          })
          .where(
            and(
              eq(friendships.requesterUserId, existing.requesterUserId),
              eq(friendships.addresseeUserId, existing.addresseeUserId),
            ),
          )
          .returning();

        return {
          sentFriendRequestToUserId: requesterUserId === updated.requesterUserId ? friendships.addresseeUserId : requesterUserId,
          status: updated.status,
          createdAt: updated.createdAt
        };
      }
    }

    const [newFriendRequest] = await this.db
      .insert(friendships)
      .values({
        requesterUserId: requesterUserId,
        addresseeUserId: addresseeUserId,
        status: FriendshipStatus.PENDING
      })
      .returning();

    return {
      sentFriendRequestToUserId: addresseeUserId,
      status: newFriendRequest.status,
      createdAt: newFriendRequest.createdAt
    };
  }
}
