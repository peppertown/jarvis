import { Module } from '@nestjs/common';
import { PersonaService } from './persona.service';
import { PersonaController } from './persona.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [PersonaService],
  controllers: [PersonaController],
  exports: [PersonaService], // 다른 모듈에서 사용할 수 있도록
})
export class PersonaModule {}
