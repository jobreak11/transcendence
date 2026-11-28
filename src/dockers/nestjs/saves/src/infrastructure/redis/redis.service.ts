import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { REDIS_CLIENT, type RedisClient } from './redis.provider.js';
import * as crypto from "node:crypto"
import { RedisKey } from 'ioredis';
 
@Injectable()
export class RedisService implements OnModuleInit {

  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
  ) {

  }

  async onModuleInit() {


    // return 1 mean success
    // return 0 mean the field doesn't exist
    await this.redis.defineCommand("hsetOneIfKeyAndFieldExist", {
      numberOfKeys: 1,
      readOnly: false,
      lua: `

        local key = KEYS[1]

        local field = ARGV[1]
        local newValue = ARGV[2]

        if redis.call('HEXISTS', key, field) == 0 then
          return 0
        end

        redis.call('HSET', key, field, newValue)
        return 1;
      `
    })

    await this.redis.defineCommand("sortedSetFIFOWithLimitAdd", {
      numberOfKeys: 1,
      readOnly: false,
      lua: `

        local sortedSetKey = KEYS[1]

        local newElement = ARGV[1]
        local limit = tonumber(ARGV[2])
        local score = tonumber(ARGV[3])

        redis.call('ZADD', sortedSetKey, score, newElement)
        local currLen = redis.call('ZCARD', sortedSetKey)
        if currLen > limit then

          local returnArray = redis.call('ZPOPMIN', sortedSetKey)
          return returnArray
        end

        return nil
      `
    })

    await this.redis.defineCommand("setWithLimitAdd", {
      numberOfKeys: 1,
      readOnly: false,
      lua: `

        local setKey = KEYS[1]

        local newElement = ARGV[1]
        local limit = tonumber(ARGV[2])

        local currLen = redis.call('SCARD', setKey)
        if currLen >= limit then
          return 1
        end

        if redis.call('SADD', setKey, newElement) ~= 1 then
          return 2
        end

        return 0
      `
    })

  }


}
