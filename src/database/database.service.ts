import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DatabaseService {
  constructor(private prisma: PrismaService) {}

  async query<T = any>(query: string, params: any[] = []): Promise<T[]> {
    return this.prisma.$queryRawUnsafe<T[]>(query, ...params) as Promise<T[]>;
  }

  async execute(query: string, params: any[] = []): Promise<number> {
    const result = await this.prisma.$executeRawUnsafe(query, ...params);
    return result;
  }

  async transaction<T>(
    callback: (client: DatabaseService) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (prisma) => {
      const transactionClient = new DatabaseService(prisma as any);
      return callback(transactionClient);
    });
  }
}
