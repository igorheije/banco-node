import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Autorização não fornecida');
    }

    const [type, credentials] = authHeader.split(' ');

    if (type === 'Bearer') {
      return this.validateJwtToken(credentials);
    } else if (type === 'Basic') {
      return this.validateBasicAuth(credentials);
    }

    throw new UnauthorizedException('Tipo de autenticação inválido');
  }

  private async validateJwtToken(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private validateBasicAuth(credentials: string): boolean {
    const [username, password] = Buffer.from(credentials, 'base64')
      .toString('utf-8')
      .split(':');

    const isValid = username === 'admin' && password === 'admin123';

    if (!isValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return true;
  }
  async encodeToken(payload: any): Promise<string> {
    return this.jwtService.sign(payload, {
      secret: jwtConfig.secret,
      expiresIn: '1h',
    });
  }

  async decodeToken(token: string): Promise<any> {
    const [type, credentials] = token.split(' ');

    if (type === 'Bearer') {
      const payload = await this.jwtService.verifyAsync(credentials);
      return payload.sub;
    } else {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
