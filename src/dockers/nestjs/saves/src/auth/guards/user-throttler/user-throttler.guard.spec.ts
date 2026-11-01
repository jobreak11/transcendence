import { UserThrottlerGuard } from './user-throttler.guard.js';

describe('UserThrottlerGuard', () => {
  it('should be defined', () => {
    expect(new UserThrottlerGuard()).toBeDefined();
  });
});
