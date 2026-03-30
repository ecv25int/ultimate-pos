import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordUtil } from './password.util';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash and validate password', async () => {
    const password = 'testpassword';
    const hash = await PasswordUtil.hashPassword(password);
    expect(await PasswordUtil.validatePassword(password, hash)).toBe(true);
    expect(await PasswordUtil.validatePassword('wrong', hash)).toBe(false);
  });

  // Add more tests for CRUD and business logic as needed
});
