import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Request } from 'express';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/auth.guard';
import { UnauthorizedException } from '@nestjs/common';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
  };
  headers: {
    authorization: string;
  };
}

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    deposit: jest.fn(),
    transfer: jest.fn(),
    reverseTransaction: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: 'user123',
      email: 'user@example.com',
    },
    headers: {
      authorization: 'Bearer mock-token',
    },
  } as unknown as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule],
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
        {
          provide: AuthGuard,
          useValue: {
            decodeToken: jest.fn().mockImplementation((token) => {
              if (token === 'Bearer mock-token') {
                return Promise.resolve('user123');
              }
              return Promise.resolve(null);
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deposit', () => {
    it('deve chamar transactionsService.deposit com os parâmetros corretos', async () => {
      const amount = 100.5;
      const expectedResult = { success: true, message: 'Deposit successful' };

      mockTransactionsService.deposit.mockResolvedValue(expectedResult);

      const result = await controller.deposit(mockRequest, amount);

      expect(service.deposit).toHaveBeenCalledWith('user123', amount);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar UnauthorizedException quando o token é inválido', async () => {
      await expect(
        controller.deposit(
          {
            headers: {
              authorization: 'Bearer invalid-token',
            },
          } as any,
          100.5,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('transfer', () => {
    it('deve chamar transactionsService.transfer com os parâmetros corretos', async () => {
      const toAccountId = 'account123';
      const amount = 50.75;
      const expectedResult = { success: true, message: 'Transfer successful' };

      mockTransactionsService.transfer.mockResolvedValue(expectedResult);

      const result = await controller.transfer(
        mockRequest,
        toAccountId,
        amount,
      );

      expect(service.transfer).toHaveBeenCalledWith(
        'user123',
        toAccountId,
        amount,
      );
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar UnauthorizedException quando o token é inválido', async () => {
      await expect(
        controller.transfer(
          {
            headers: {
              authorization: 'Bearer invalid-token',
            },
          } as any,
          'account123',
          50.75,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('reverseTransaction', () => {
    it('deve chamar transactionsService.reverseTransaction com os parâmetros corretos', async () => {
      const transactionId = 'transaction123';
      const expectedResult = { success: true, message: 'Transaction reversed' };

      mockTransactionsService.reverseTransaction.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.reverseTransaction(
        mockRequest,
        transactionId,
      );

      expect(service.reverseTransaction).toHaveBeenCalledWith(transactionId);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar UnauthorizedException quando o token é inválido', async () => {
      await expect(
        controller.reverseTransaction(
          {
            headers: {
              authorization: 'Bearer invalid-token',
            },
          } as any,
          'transaction123',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
