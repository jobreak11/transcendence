import { Test, TestingModule } from '@nestjs/testing';
import { TitleController } from './title.controller.js';

describe('TitleController', () => {
  let controller: TitleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TitleController],
    }).compile();

    controller = module.get<TitleController>(TitleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
