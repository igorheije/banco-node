import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionsService {
  constructor(private database: DatabaseService) {}

  private async getUserAccount(accountId: string) {
    const [account] = await this.database.query(
      'SELECT * FROM accounts WHERE id = $1',
      [accountId],
    );
    return account;
  }
  private async getAccountByUserId(userId: string) {
    const [account] = await this.database.query(
      'SELECT * FROM accounts WHERE user_id = $1',
      [userId],
    );
    return account;
  }

  async deposit(userId: string, amount: number) {
    const account = await this.getAccountByUserId(userId);
    if (!account) {
      throw new BadRequestException('Conta não encontrada');
    }

    return await this.database.transaction(async (client) => {
      const sum = Number(account.balance) + amount;
      await client.execute('UPDATE accounts SET balance = $1 WHERE id = $2', [
        sum,
        account.id,
      ]);

      const [transaction] = await client.query(
        `INSERT INTO transactions (id, from_account_id, to_account_id, amount, type, status)
         VALUES ($1, $2, $3, $4, $5::"TransactionType", $6::"TransactionStatus")
         RETURNING *`,
        [uuidv4(), account.id, account.id, amount, 'deposit', 'completed'],
      );
      return transaction;
    });
  }

  async transfer(userId: string, toAccountId: string, amount: number) {
    const fromAccount = await this.getAccountByUserId(userId);
    const toAccount = await this.getUserAccount(toAccountId);

    if (!fromAccount || !toAccount) {
      throw new BadRequestException('Conta não encontrada');
    }

    if (fromAccount?.balance < amount) {
      throw new BadRequestException('Saldo insuficiente');
    }

    try {
      return await this.database.transaction(async (client) => {
        const sum = Number(fromAccount.balance) - amount;
        const sumToAccount = Number(toAccount.balance) + amount;

        try {
          await client.execute(
            'UPDATE accounts SET balance = $1 WHERE id = $2',
            [Number(sum), fromAccount.id],
          );
          await client.execute(
            'UPDATE accounts SET balance = $1 WHERE id = $2',
            [Number(sumToAccount), toAccount.id],
          );

          const [transaction] = await client.query(
            `INSERT INTO transactions (id, from_account_id, to_account_id, amount, type, status)
             VALUES ($1, $2, $3, $4, $5::"TransactionType", $6::"TransactionStatus")
             RETURNING *`,
            [
              uuidv4(),
              fromAccount.id,
              toAccountId,
              amount,
              'transfer',
              'completed',
            ],
          );
          return transaction;
        } catch (error) {
          await client.query(
            `INSERT INTO transactions (id, from_account_id, to_account_id, amount, type, status)
             VALUES ($1, $2, $3, $4, $5::"TransactionType", $6::"TransactionStatus")
             RETURNING *`,
            [
              uuidv4(),
              fromAccount.id,
              toAccountId,
              amount,
              'transfer',
              'failed',
            ],
          );
          throw new BadRequestException('Erro ao transferir', error.message);
        }
      });
    } catch (error) {
      await this.database.query(
        `INSERT INTO transactions (id, from_account_id, to_account_id, amount, type, status)
         VALUES ($1, $2, $3, $4, $5::"TransactionType", $6::"TransactionStatus")
         RETURNING *`,
        [uuidv4(), fromAccount.id, toAccountId, amount, 'transfer', 'failed'],
      );
      throw new BadRequestException('Erro ao transferir', error.message);
    }
  }

  async reverseTransaction(transactionId: string) {
    const [verifyTransaction] = await this.database.query(
      'SELECT * FROM transactions WHERE id = $1',
      [transactionId],
    );
    if (!verifyTransaction) {
      throw new BadRequestException('Transação não encontrada');
    }
    const [verifyReversedTransaction] = await this.database.query(
      'SELECT * FROM transactions WHERE reversed_transaction_id = $1 AND status = $2::"TransactionStatus"',
      [transactionId, 'reversed'],
    );
    if (verifyReversedTransaction) {
      throw new BadRequestException('Transação já foi revertida');
    }

    const fromAccount = await this.getUserAccount(
      verifyTransaction.from_account_id,
    );
    const toAccount = await this.getUserAccount(
      verifyTransaction.to_account_id,
    );

    return await this.database.transaction(async (client) => {
      const sum =
        Number(fromAccount.balance) + Number(verifyTransaction.amount);
      const sumToAccount =
        Number(toAccount.balance) - Number(verifyTransaction.amount);

      try {
        await client.execute('UPDATE accounts SET balance = $1 WHERE id = $2', [
          Number(sum),
          verifyTransaction.from_account_id,
        ]);
        await client.execute('UPDATE accounts SET balance = $1 WHERE id = $2', [
          Number(sumToAccount),
          verifyTransaction.to_account_id,
        ]);

        const [transaction] = await client.query(
          `INSERT INTO transactions (id, from_account_id, to_account_id, amount, type, status, reversed_transaction_id)
           VALUES ($1, $2, $3, $4, $5::"TransactionType", $6::"TransactionStatus", $7)
           RETURNING *`,
          [
            uuidv4(),
            verifyTransaction.to_account_id,
            verifyTransaction.from_account_id,
            verifyTransaction.amount,
            'refund',
            'reversed',
            transactionId,
          ],
        );
        return transaction;
      } catch (error) {
        await client.query(
          `INSERT INTO transactions (id, from_account_id, to_account_id, amount, type, status, reversed_transaction_id)
           VALUES ($1, $2, $3, $4, $5::"TransactionType", $6::"TransactionStatus", $7)
           RETURNING *`,
          [
            uuidv4(),
            verifyTransaction.to_account_id,
            verifyTransaction.from_account_id,
            verifyTransaction.amount,
            'refund',
            'failed',
            transactionId,
          ],
        );
        throw new BadRequestException('Erro ao transferir', error.message);
      }
    });
  }
}
