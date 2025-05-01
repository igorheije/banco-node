import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from './auth.guard';
@Injectable()
export class AuthService {
  constructor(
    private database: DatabaseService,
    private authGuard: AuthGuard,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const [user] = await this.database.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new UnauthorizedException('Credenciais inválidas');
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    const token = await this.authGuard.encodeToken(payload);
    return {
      access_token: token,
    };
  }

  async register(name: string, email: string, password: string) {
    const [existingUser] = await this.database.query(
      'SELECT * FROM users WHERE email = $1',
      [email],
    );

    if (existingUser) {
      throw new BadRequestException('Usuário já existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.database.transaction(async (client) => {
      const [user] = await client.query(
        `INSERT INTO users (id, name, email, password)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, created_at`,
        [uuidv4(), name, email, hashedPassword],
      );

      await client.execute(
        `INSERT INTO accounts (id, user_id, balance)
         VALUES ($1, $2, $3)`,
        [uuidv4(), user.id, 0],
      );

      return user;
    });
  }
}
