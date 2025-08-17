import { TaskIntent, TopicTag } from '../ai.interface';

// 화이트 리스트 (모델이 엉뚱한 값 내놔도 시스템이 안 깨지게)
const TASKS: TaskIntent[] = [
  'code',
  'analysis',
  'explain',
  'creative',
  'chat',
  'retrieve',
  'summarize',
  'translate',
  'plan',
  'transact',
  'control',
];
const TOPICS: TopicTag[] = [
  'sports',
  'finance',
  'tech',
  'travel',
  'cooking',
  'health',
  'entertainment',
  'education',
  'law',
  'career',
  'productivity',
  'gaming',
  'personal',
  'other',
];

// AI 응답에서 JSON 추출 로직
export function extractFirstJsonChunk(text: string): string | null {
  // 1) 코드펜스 안 JSON 찾기
  const fence = text.match(/```json\s*([\s\S]*?)```/i);
  if (fence && fence[1]) return fence[1].trim();

  // 2) 그냥 { ... } 블록 찾기
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) return brace[0].trim();

  return null;
}

// 분석 결과 파싱
// 타입 수정 필요(analyzeResult 타입 추가 필요)
export function parseAnalyzeResult(raw: string) {
  let obj: any;

  // 1) 파싱 시도
  try {
    obj = JSON.parse(raw);
  } catch {
    return fallback(); // 파싱 오류 시 폴백
  }

  // 2) task 보정
  const task: TaskIntent = TASKS.includes(obj.task) ? obj.task : 'chat';

  // 3) topics 보정
  const topics: TopicTag[] = Array.isArray(obj.topics)
    ? obj.topics.filter((t: any) => TOPICS.includes(t))
    : [];

  // 4) insight는 일단 그대로 둠
  const insight = (obj.insight || '').toString().trim();

  return { task, topics, insight };
}

// 안전 폴백
function fallback() {
  return { task: 'chat', topics: [], insight: '' };
}

/* 
    사용 플로우
    1. extractFirstJsonChunk() 로 AI 응답에서 JSON 부분만 추출
    2. 추출된 JSON을 parseAnalyzeResult()를 통해 파싱
        - 화이트 리스트를 통해 정의된 주제내에 없을 시 예외처리
        - 파싱 오류 시 예외처리 fallback()
    3. 파싱된 JSON 리턴
*/
