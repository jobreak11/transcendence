import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerException, ThrottlerGuard, ThrottlerLimitDetail, ThrottlerRequest } from "@nestjs/throttler";
import { FastifyRequest } from "fastify";

@Injectable()
export class PublicApiThrottlerGuard extends ThrottlerGuard {

    protected async getTracker(req: Record<string, any>): Promise<string> {
        const fastifyReq = req as FastifyRequest;

        const apiKey = fastifyReq.headers['x-api-key'];

        if (typeof apiKey === 'string' && apiKey.length > 0) {
            return `apiKey_${apiKey}`;
        }

        return fastifyReq.ip
        
    }

    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
      if (requestProps.throttler.name !== 'public-api') {
        return true;
      }
      return super.handleRequest(requestProps);
    }

    protected async throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<void> {
      throw new ThrottlerException('Api rate limit exceed across your devices. Please slow down')
    }

    

}