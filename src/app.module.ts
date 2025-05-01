import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { MainModule } from './main/main.module';
import { PrismaService } from './prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [MainModule, AuthModule, TransactionsModule, JwtModule],
  providers: [PrismaService],
})
export class AppModule {}
