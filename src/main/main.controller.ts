import { Controller, Get, Version, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller()
export class MainController {
  @ApiTags('Main')
  @Version('1')
  @Get('/healthz')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Status da API',
    description: 'Verifica o status da API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'API está no ar',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'API está inoperante',
  })
  async healthz() {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
    };

    return healthCheck;
  }
}
