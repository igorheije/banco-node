import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('TransactionsService', () => {
  let service: TransactionsService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: DatabaseService,
          useValue: {
            query: jest.fn(),
            transaction: jest.fn(),
            execute: jest.fn(),
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

    service = module.get<TransactionsService>(TransactionsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  describe('deposit', () => {
    it('should successfully deposit money', async () => {
      const mockAccount = {
        id: 'account-1',
        user_id: 'user-1',
        balance: 100,
      };

      (databaseService.query as jest.Mock).mockResolvedValue([mockAccount]);
      (databaseService.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const mockClient = {
            execute: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue([
              {
                id: 'transaction-1',
                from_account_id: mockAccount.id,
                to_account_id: mockAccount.id,
                amount: 50,
                type: 'deposit',
                status: 'completed',
              },
            ]),
          };
          return callback(mockClient);
        },
      );

      const result = await service.deposit('user-1', 50);
      expect(result).toEqual({
        id: 'transaction-1',
        from_account_id: mockAccount.id,
        to_account_id: mockAccount.id,
        amount: 50,
        type: 'deposit',
        status: 'completed',
      });
    });

    it('should throw BadRequestException when account not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue([]);

      await expect(service.deposit('user-1', 50)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('transfer', () => {
    it('should successfully transfer money', async () => {
      const mockFromAccount = {
        id: 'account-1',
        user_id: 'user-1',
        balance: 100,
      };
      const mockToAccount = {
        id: 'account-2',
        user_id: 'user-2',
        balance: 50,
      };

      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce([mockFromAccount])
        .mockResolvedValueOnce([mockToAccount]);

      (databaseService.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const mockClient = {
            execute: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue([
              {
                id: 'transaction-1',
                from_account_id: mockFromAccount.id,
                to_account_id: mockToAccount.id,
                amount: 30,
                type: 'transfer',
                status: 'completed',
              },
            ]),
          };
          return callback(mockClient);
        },
      );

      const result = await service.transfer('user-1', 'account-2', 30);
      expect(result).toEqual({
        id: 'transaction-1',
        from_account_id: mockFromAccount.id,
        to_account_id: mockToAccount.id,
        amount: 30,
        type: 'transfer',
        status: 'completed',
      });
    });

    it('should throw BadRequestException when account not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue([]);

      await expect(service.transfer('user-1', 'account-2', 30)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      const mockFromAccount = {
        id: 'account-1',
        user_id: 'user-1',
        balance: 20,
      };
      const mockToAccount = {
        id: 'account-2',
        user_id: 'user-2',
        balance: 50,
      };

      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce([mockFromAccount])
        .mockResolvedValueOnce([mockToAccount]);

      await expect(service.transfer('user-1', 'account-2', 30)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reverseTransaction', () => {
    it('should successfully reverse a transaction', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        from_account_id: 'account-1',
        to_account_id: 'account-2',
        amount: 30,
        type: 'transfer',
        status: 'completed',
      };

      const mockFromAccount = {
        id: 'account-1',
        balance: 70,
      };

      const mockToAccount = {
        id: 'account-2',
        balance: 130,
      };

      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce([mockTransaction])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockFromAccount])
        .mockResolvedValueOnce([mockToAccount]);

      (databaseService.transaction as jest.Mock).mockImplementation(
        async (callback) => {
          const mockClient = {
            execute: jest.fn().mockResolvedValue(undefined),
            query: jest.fn().mockResolvedValue([
              {
                id: 'transaction-2',
                from_account_id: mockTransaction.to_account_id,
                to_account_id: mockTransaction.from_account_id,
                amount: mockTransaction.amount,
                type: 'refund',
                status: 'reversed',
                reversed_transaction_id: mockTransaction.id,
              },
            ]),
          };
          return callback(mockClient);
        },
      );

      const result = await service.reverseTransaction('transaction-1');
      expect(result).toEqual({
        id: 'transaction-2',
        from_account_id: mockTransaction.to_account_id,
        to_account_id: mockTransaction.from_account_id,
        amount: mockTransaction.amount,
        type: 'refund',
        status: 'reversed',
        reversed_transaction_id: mockTransaction.id,
      });
    });

    it('should throw BadRequestException when transaction not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue([]);

      await expect(service.reverseTransaction('transaction-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when transaction already reversed', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        from_account_id: 'account-1',
        to_account_id: 'account-2',
        amount: 30,
        type: 'transfer',
        status: 'completed',
      };

      const mockReversedTransaction = {
        id: 'transaction-2',
        reversed_transaction_id: 'transaction-1',
        status: 'reversed',
      };

      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce([mockTransaction])
        .mockResolvedValueOnce([mockReversedTransaction]);

      await expect(service.reverseTransaction('transaction-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
