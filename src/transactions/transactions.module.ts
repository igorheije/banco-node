import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from 'src/config/jwt.config';

@Module({
  imports: [AuthModule, JwtModule.register(jwtConfig)],
  controllers: [TransactionsController],
  providers: [TransactionsService, DatabaseService, PrismaService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
