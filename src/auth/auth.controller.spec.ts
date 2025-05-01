import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    validateUser: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with correct parameters', async () => {
      const name = 'John Doe';
      const email = 'john@example.com';
      const password = 'password123';
      const expectedResult = {
        success: true,
        message: 'User registered successfully',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(name, email, password);

      expect(service.register).toHaveBeenCalledWith(name, email, password);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.validateUser and login with correct parameters', async () => {
      const email = 'john@example.com';
      const password = 'password123';
      const mockUser = { id: '1', email };
      const expectedToken = { access_token: 'mock-token' };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(expectedToken);

      const result = await controller.login(email, password);

      expect(service.validateUser).toHaveBeenCalledWith(email, password);
      expect(service.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(expectedToken);
    });

    it('should throw error when credentials are invalid', async () => {
      const email = 'john@example.com';
      const password = 'wrong-password';

      mockAuthService.validateUser.mockRejectedValue(
        new UnauthorizedException('Credenciais inválidas'),
      );

      await expect(controller.login(email, password)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
