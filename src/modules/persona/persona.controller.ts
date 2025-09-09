import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PersonaService } from './persona.service';

@Controller('persona')
@UseGuards(JwtAuthGuard)
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  // 사용자의 페르소나 조회
  @Get()
  async getPersona(@Request() req) {
    const userId = req.user.sub;
    const persona = await this.personaService.getPersona(userId);

    return {
      success: true,
      data: persona,
      timestamp: new Date().toISOString(),
    };
  }

  // 페르소나 강제 업데이트 (개발/테스트용)
  @Post('update')
  async updatePersona(@Request() req) {
    const userId = req.user.sub;
    const updatedPersona = await this.personaService.updatePersona(userId);

    return {
      success: true,
      data: updatedPersona,
      message: updatedPersona
        ? 'Persona updated successfully'
        : 'No insights found to update persona',
      timestamp: new Date().toISOString(),
    };
  }
}
