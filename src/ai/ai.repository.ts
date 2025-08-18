import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDTO } from './dto/create-message.dto';

@Injectable()
export class JarvisRepository {
  constructor(private db: PrismaService) {}

  /* DB에 메세지 저장
  1. 세션 아이디
  2. 유저 아이디(ai일시 null)
  3. role (user, system)
  4. content
  5. task , topics, insight
  6. model
  7. tokensIn
  8. tokensOut
  */
  async createMessage(createMessageDTO: CreateMessageDTO) {
    await this.db.message.create({
      data: createMessageDTO,
    });
  }
}

/* 채팅 플로우 
    유저 입력
    카테고리 분류 (ai 호출)
    최적 ai 선택
    ai 응답 (ai 호출)

    유저 데이터 저장시
    jarvis.chat 에서 바로 저장가능

    assistant 데이터 저장시
    const category = await this.helper.analyzeQuery(message); -> 5번

    chat의 리턴값을 response(응답 원본), message(응답 content), provider 로 변경 -> 6,7,8 해결

*/
