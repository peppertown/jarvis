import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PersonaService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('ai.openai.apiKey'),
    });
  }

  // 사용자의 현재 페르소나 조회
  async getPersona(userId: number) {
    return await this.prisma.persona.findUnique({
      where: { userId },
    });
  }

  // 인사이트 기반으로 페르소나 생성/업데이트
  async updatePersona(userId: number) {
    console.log('🎭 [PersonaService] Updating persona for user:', userId);

    // 1. 사용자의 모든 인사이트 가져오기
    const insights = await this.prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (insights.length === 0) {
      console.log(
        '⚠️ [PersonaService] No insights found, skipping persona update',
      );
      return null;
    }

    // 2. 현재 페르소나 가져오기 (있다면)
    const currentPersona = await this.getPersona(userId);

    // 3. AI에게 페르소나 생성/업데이트 요청
    const systemPrompt = this.buildPersonaPrompt(currentPersona, insights);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }],
        max_completion_tokens: 800,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0].message.content;
      console.log('🤖 [PersonaService] AI persona response:', aiResponse);

      // 4. AI 응답 파싱 및 저장
      const parsedPersona = this.parsePersonaResponse(aiResponse);

      if (!parsedPersona) {
        console.error('❌ [PersonaService] Failed to parse persona response');
        return null;
      }

      // 5. 데이터베이스에 저장/업데이트
      const savedPersona = await this.prisma.persona.upsert({
        where: { userId },
        update: {
          ...parsedPersona,
          version: currentPersona ? currentPersona.version + 1 : 1,
        },
        create: {
          userId,
          ...parsedPersona,
          version: 1,
        },
      });

      console.log('✅ [PersonaService] Persona updated:', savedPersona.id);
      return savedPersona;
    } catch (error) {
      console.error('❌ [PersonaService] Error updating persona:', error);
      return null;
    }
  }

  // 페르소나 생성 프롬프트 구성
  private buildPersonaPrompt(currentPersona: any, insights: any[]) {
    const insightsText = insights.map((i) => `- ${i.content}`).join('\n');

    if (currentPersona) {
      return `당신은 사용자의 페르소나를 업데이트하는 AI입니다.

기존 페르소나:
- 성격: ${currentPersona.personality || '없음'}
- 관심사: ${JSON.stringify(currentPersona.interests) || '[]'}
- 스킬: ${JSON.stringify(currentPersona.skills) || '{}'}
- 선호도: ${JSON.stringify(currentPersona.preferences) || '[]'}
- 성향: ${JSON.stringify(currentPersona.traits) || '[]'}
- 요약: ${currentPersona.summary || '없음'}

새로운 인사이트들:
${insightsText}

기존 페르소나를 새로운 인사이트로 스마트하게 업데이트해주세요. 중복되는 내용은 합치고, 모순되는 내용은 최신 정보로 업데이트하세요.

다음 JSON 형식으로 응답해주세요:
{
  "personality": "한 줄로 표현한 핵심 성격",
  "interests": ["관심사1", "관심사2"],
  "skills": {"분야": "수준"},
  "preferences": ["선호사항1", "선호사항2"],
  "traits": ["성향1", "성향2"],
  "summary": "전체 페르소나에 대한 2-3문장 요약"
}`;
    } else {
      return `당신은 사용자의 페르소나를 생성하는 AI입니다.

사용자의 인사이트들:
${insightsText}

이 인사이트들을 바탕으로 사용자의 페르소나를 생성해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "personality": "한 줄로 표현한 핵심 성격",
  "interests": ["관심사1", "관심사2"],
  "skills": {"분야": "수준"},
  "preferences": ["선호사항1", "선호사항2"],
  "traits": ["성향1", "성향2"],
  "summary": "전체 페르소나에 대한 2-3문장 요약"
}`;
    }
  }

  // AI 응답 파싱
  private parsePersonaResponse(response: string) {
    try {
      // JSON 부분 추출 시도
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ [PersonaService] No JSON found in response');
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        personality: parsed.personality || null,
        interests: parsed.interests || null,
        skills: parsed.skills || null,
        preferences: parsed.preferences || null,
        traits: parsed.traits || null,
        summary: parsed.summary || null,
      };
    } catch (error) {
      console.error('❌ [PersonaService] JSON parse error:', error);
      return null;
    }
  }
}
