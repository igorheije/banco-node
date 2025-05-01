import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseService } from '../database/database.service';
import { PrismaService } from '../prisma/prisma.service';
import { jwtConfig } from '../config/jwt.config';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [JwtModule.register(jwtConfig)],
  controllers: [AuthController],
  providers: [AuthService, DatabaseService, PrismaService, AuthGuard],
  exports: [AuthService, JwtModule, AuthGuard],
})
export class AuthModule {}
