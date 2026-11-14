import { GoogleAuthGuard } from './google-auth.guard.js';

describe('GoogleAuthGuard', () => {
  it('should be defined', () => {
    expect(new GoogleAuthGuard()).toBeDefined();
  });
});
