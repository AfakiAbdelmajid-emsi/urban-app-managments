import { Test, TestingModule } from '@nestjs/testing';
import { AlertsGateway } from './alerts.gateway';

describe('AlertsGateway', () => {
  let gateway: AlertsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsGateway],
    }).compile();

    gateway = module.get<AlertsGateway>(AlertsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
