import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDTO } from './dto/create-message.dto';

@Injectable()
export class JarvisRepository {
  constructor(private db: PrismaService) {}
}
