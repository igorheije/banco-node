import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PrismaService } from './prisma/prisma.service';
@Module({
  imports: [AuthModule, TransactionsModule],
  providers: [PrismaService],
})
export class AppModule {}
