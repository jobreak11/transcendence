import { Test, TestingModule } from '@nestjs/testing';
import * as redisMock from 'redis-mock'
import { RedisService } from './redis.service.js';
import { JsonWebTokenError } from '@nestjs/jwt';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService,
      {
        provide: 'REDIS_CLIENT',
        useValue: redisMock.createClient(),
      }

      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
