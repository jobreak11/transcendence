import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerLimitDetail, ThrottlerRequest } from "@nestjs/throttler";
import { WsException } from "@nestjs/websockets";

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, throttler, blockDuration, generateKey } = requestProps;

    const client = context.switchToWs().getClient();

    const tracker = client?.data?.user as string ?? client.id as string;
    const key = generateKey(context, tracker, throttler.name ?? "default");

    const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } = await this.storageService.increment(
      key,
      ttl,
      limit,
      blockDuration,
      throttler.name ?? "",
    );

    if (isBlocked) {

      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire
      });

    }

    return true;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: Record<string, any>): Promise<void> {

    const client = context.switchToWs().getClient();

    client.emit("exception", {
      status: "error",
      message: "Too Many Requests",
      retryAfter: Math.ceil(throttlerLimitDetail.timeToBlockExpire / 1000),
    });

    throw new WsException("Too Many Requests");
  }
  

}