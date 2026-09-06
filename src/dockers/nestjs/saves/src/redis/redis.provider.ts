import { Injectable } from '@nestjs/common';
import { Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { parse } from 'path';
 
export type RedisClient = Redis;

export const redisProvider: Provider = {
  useFactory: (): RedisClient => {
    return new Redis<'legacy'>(
      parseInt(process.env.REDIS_EXPOSE_PORT as string) ?? 6379 ,
      'redis',
    );
    //return new Redis({
    //  host: 'redis',
    //  port: process.env.REDIS_EXPORT_PORT
    //});
  },
  provide: 'REDIS_CLIENT',
};


