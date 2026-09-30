import { FriendshipStatus } from "../../drizzle/schema/friendships.schema.js"

export class FindAllFriendshipsDto {
  sentRequests: {
    userId: string,
    status: FriendshipStatus,
    createdAt: Date,
  }[] = [];
  receivedRequests: {
    userId: string,
    status: FriendshipStatus,
    createdAt: Date,
  }[] = [];
  acceptedFriends: {
    userId: string,
    status: FriendshipStatus,
    createdAt: Date,
  }[] = [];
}