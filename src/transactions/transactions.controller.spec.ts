import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Request } from 'express';
import { JwtModule } from '@nestjs/jwt';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
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
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deposit', () => {
    it('should call transactionsService.deposit with correct parameters', async () => {
      const amount = 100.5;
      const expectedResult = { success: true, message: 'Deposit successful' };

      mockTransactionsService.deposit.mockResolvedValue(expectedResult);

      const result = await controller.deposit(mockRequest, amount);

      expect(service.deposit).toHaveBeenCalledWith(
        mockRequest.user.sub,
        amount,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('transfer', () => {
    it('should call transactionsService.transfer with correct parameters', async () => {
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
        mockRequest.user.sub,
        toAccountId,
        amount,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('reverseTransaction', () => {
    it('should call transactionsService.reverseTransaction with correct parameters', async () => {
      const transactionId = 'transaction123';
      const expectedResult = { success: true, message: 'Transaction reversed' };

      mockTransactionsService.reverseTransaction.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.reverseTransaction(transactionId);

      expect(service.reverseTransaction).toHaveBeenCalledWith(transactionId);
      expect(result).toEqual(expectedResult);
    });
  });
});
