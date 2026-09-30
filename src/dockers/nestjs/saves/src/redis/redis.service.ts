import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT, type RedisClient } from './redis.provider.js';
import * as crypto from "node:crypto"
import { RedisKey } from 'ioredis';
 
@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly client: RedisClient,
  ) {}

  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (data === null)
      return (null);

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<'OK' | null> {

    if (value === undefined)
      throw new Error(`Cannot set undefined value for key '${key}'`)

    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttlSeconds && ttlSeconds > 0) {
      return this.client.set(key, serialized, 'EX', ttlSeconds);
    }
    return this.client.set(key, serialized);
  }

  async del(key: string) {
    await this.client.del(key);
  }

}
