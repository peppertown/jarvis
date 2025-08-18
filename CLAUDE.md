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
- **AuthModule**: JWT 기반 인증 시스템 (회원가입, 로그인, 권한 검증)
- **ChatModule**: 세션 기반 채팅 관리 (세션 CRUD, 메시지 관리)
- **JarvisHelper**: 사용자 쿼리를 분석하여 의도를 분류하고 최적의 AI 모델을 선택
- **AI Providers**: 다양한 AI 서비스(GPT, Claude, DeepSeek)에 대한 추상화된 인터페이스
- **JarvisRepository**: 채팅 메시지와 메타데이터 저장을 위한 데이터베이스 작업 처리

### 주요 플로우

#### 인증 플로우
1. 사용자가 `POST /auth/register`로 회원가입
2. `POST /auth/login`으로 로그인하여 JWT 토큰 획득
3. 이후 모든 API 요청 시 Authorization 헤더에 Bearer 토큰 포함

#### 채팅 플로우
1. `POST /chat/sessions`로 새 채팅 세션 생성
2. `POST /chat`으로 특정 세션에 메시지 전송 (sessionId, text 포함)
3. `Jarvis.chat()`이 사용자 메시지를 해당 세션에 저장
4. `JarvisHelper.analyzeQuery()`가 GPT-4o-mini를 사용하여 요청 의도를 분류
5. `JarvisHelper.selectBestAI()`가 작업 유형에 따라 최적의 제공자를 선택:
   - **Claude**: 코드 작성, 분석, 창작, 설명
   - **GPT**: 요약, 번역, 계획, 일반 대화
6. 선택된 제공자가 요청을 처리
7. AI 응답과 메타데이터(토큰, 지연시간, 비용)가 같은 세션에 저장됨

### 데이터베이스 스키마

- **User**: 사용자 인증 정보 (id, email, password, nickname)
- **Session**: 채팅 세션 (id, userId, title, createdAt)
- **Message**: 채팅 메시지 (id, sessionId, userId, role, content, AI 메타데이터)

### AI 제공자 선택 로직

시스템은 작업 의도에 따라 자동으로 요청을 라우팅합니다:

- 코드/분석/창작/설명 → Claude
- 요약/번역/계획/채팅 → GPT
- 거래/제어 → GPT (향후 에이전트 통합을 위한 플레이스홀더)

### API 엔드포인트

#### 인증 API
- `POST /auth/register`: 회원가입 (email, password, nickname?)
- `POST /auth/login`: 로그인 → JWT 토큰 반환

#### 채팅 세션 API
- `POST /chat/sessions`: 새 세션 생성 (title?)
- `GET /chat/sessions`: 사용자의 모든 세션 조회
- `GET /chat/sessions/:id/messages`: 특정 세션의 메시지 조회
- `DELETE /chat/sessions/:id`: 세션 삭제

#### 채팅 API
- `POST /chat`: 메시지 전송 (text, sessionId)

#### 응답 형식
- **성공**: `{ success: true, data: {...}, timestamp: "..." }`
- **에러**: `{ success: false, error: { code, message, type, timestamp, path } }`

### 환경 변수

필수 환경 변수:
- `DATABASE_URL`: MySQL 연결 문자열
- `JWT_SECRET`: JWT 토큰 서명용 비밀키
- `ANTHROPIC_API_KEY`: Claude 제공자용
- `OPENAI_API_KEY`: GPT 제공자용

### MCP 통합

확장 가능한 AI 도구 기능을 위해 `@rekog/mcp-nest`를 통한 MCP(Model Context Protocol) 통합이 포함되어 있습니다.
