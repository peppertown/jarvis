# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 가이드를 제공합니다.

## 개발 명령어

```bash
# 개발
npm run start:dev          # 개발 모드 (변경사항 자동 감지)
npm run start:debug        # 디버깅 모드로 시작

# 빌드
npm run build              # 프로젝트 빌드
npm run start:prod         # 프로덕션 빌드 실행

# 테스트
npm run test               # 단위 테스트 실행
npm run test:watch         # 테스트 감시 모드
npm run test:e2e          # E2E 테스트 실행
npm run test:cov          # 테스트 커버리지 확인

# 코드 품질
npm run lint              # ESLint 실행 (자동 수정)
npm run format            # Prettier로 코드 포맷팅
```

## 데이터베이스 관리

이 프로젝트는 MySQL과 Prisma를 사용합니다:

```bash
npx prisma generate       # Prisma 클라이언트 생성
npx prisma db push        # 스키마 변경사항을 데이터베이스에 적용
npx prisma studio         # Prisma Studio 열기 (데이터베이스 관리 도구)
```

## 아키텍처 개요

### 핵심 컴포넌트

- **Jarvis**: 채팅 요청을 처리하고, 사용자 의도를 분석하여 적절한 AI 제공자를 선택하고 데이터베이스 작업을 관리하는 메인 오케스트레이터
- **AIModule**: AI 제공자들(GPT, Claude, DeepSeek)과 관련 서비스를 포함하는 글로벌 모듈
- **JarvisHelper**: 사용자 쿼리를 분석하여 의도를 분류하고 최적의 AI 모델을 선택
- **AI Providers**: 다양한 AI 서비스(GPT, Claude, DeepSeek)에 대한 추상화된 인터페이스
- **JarvisRepository**: 채팅 메시지와 메타데이터 저장을 위한 데이터베이스 작업 처리

### 주요 플로우

1. 사용자가 `/chat` 엔드포인트를 통해 채팅 요청을 보냄
2. `Jarvis.chat()`이 사용자 메시지를 데이터베이스에 저장
3. `JarvisHelper.analyzeQuery()`가 GPT-4o-mini를 사용하여 요청 의도를 분류
4. `JarvisHelper.selectBestAI()`가 작업 유형에 따라 최적의 제공자를 선택:
   - **Claude**: 코드 작성, 분석, 창작, 설명
   - **GPT**: 요약, 번역, 계획, 일반 대화
5. 선택된 제공자가 요청을 처리
6. 응답과 메타데이터(토큰, 지연시간, 비용)가 데이터베이스에 저장됨

### 데이터베이스 스키마

- **User**: 기본 사용자 정보
- **Session**: 관련 메시지들을 그룹화하는 채팅 세션
- **Message**: 역할, 내용, 성능 지표, AI 분석 메타데이터를 포함한 개별 메시지

### AI 제공자 선택 로직

시스템은 작업 의도에 따라 자동으로 요청을 라우팅합니다:

- 코드/분석/창작/설명 → Claude
- 요약/번역/계획/채팅 → GPT
- 거래/제어 → GPT (향후 에이전트 통합을 위한 플레이스홀더)

### 환경 변수

필수 환경 변수:

- `DATABASE_URL`: MySQL 연결 문자열
- `ANTHROPIC_API_KEY`: Claude 제공자용
- `OPENAI_API_KEY`: GPT 제공자용

### MCP 통합

확장 가능한 AI 도구 기능을 위해 `@rekog/mcp-nest`를 통한 MCP(Model Context Protocol) 통합이 포함되어 있습니다.
