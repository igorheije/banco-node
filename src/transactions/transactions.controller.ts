import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly authGuard: AuthGuard,
  ) {}

  @Post('deposit')
  @ApiOperation({ summary: 'Realizar depósito' })
  @ApiResponse({ status: 201, description: 'Depósito realizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 100.5 },
      },
    },
  })
  async deposit(@Req() req: RequestWithUser, @Body('amount') amount: number) {
    const userId = await this.authGuard.decodeToken(req.headers.authorization);
    if (!userId) {
      throw new UnauthorizedException('Não autorizado');
    }
    return this.transactionsService.deposit(userId, amount);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Realizar transferência' })
  @ApiResponse({
    status: 201,
    description: 'Transferência realizada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        toAccountId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        amount: { type: 'number', example: 100.5 },
      },
    },
  })
  async transfer(
    @Req() req: RequestWithUser,
    @Body('toAccountId') toAccountId: string,
    @Body('amount') amount: number,
  ) {
    const userId = await this.authGuard.decodeToken(req.headers.authorization);
    if (!userId) {
      throw new UnauthorizedException('Não autorizado');
    }

    return this.transactionsService.transfer(userId, toAccountId, amount);
  }

  @Post('reverse/:transactionId')
  @ApiOperation({ summary: 'Reversão de transação' })
  @ApiResponse({ status: 200, description: 'Transação revertida com sucesso' })
  @ApiResponse({ status: 400, description: 'Transação inválida' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async reverseTransaction(
    @Req() req: RequestWithUser,
    @Param('transactionId') transactionId: string,
  ) {
    const userId = await this.authGuard.decodeToken(req.headers.authorization);
    if (!userId) {
      throw new UnauthorizedException('Não autorizado');
    }
    return this.transactionsService.reverseTransaction(transactionId);
  }
}
