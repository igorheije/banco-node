import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

jest.mock('bcrypt');
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: DatabaseService;
  let authGuard: AuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: {
            query: jest.fn(),
            transaction: jest.fn(),
          },
        },
        {
          provide: AuthGuard,
          useValue: {
            encodeToken: jest.fn().mockReturnValue('mocked-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    authGuard = module.get<AuthGuard>(AuthGuard);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      (databaseService.query as jest.Mock).mockResolvedValue([mockUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue([]);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      (databaseService.query as jest.Mock).mockResolvedValue([mockUser]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
      };

      const result = await service.login(mockUser);
      expect(result).toEqual({
        access_token: 'mocked-jwt-token',
      });
      expect(authGuard.encodeToken).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
      });
    });
  });

  describe('register', () => {
    it('should create user and account', async () => {
      const mockUser = {
        id: 'mocked-uuid',
        name: 'Test User',
        email: 'test@example.com',
        created_at: new Date(),
      };

      (databaseService.query as jest.Mock).mockResolvedValue([]);
      (databaseService.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const mockClient = {
            query: jest.fn().mockResolvedValue([mockUser]),
            execute: jest.fn().mockResolvedValue(undefined),
          };
          return callback(mockClient);
        },
      );

      const result = await service.register(
        'Test User',
        'test@example.com',
        'password',
      );
      expect(result).toEqual(mockUser);
    });
  });
});
