export interface TrailQuestionResponse {
  id: string;
  statement: string;
  type: string;
  sequence: number;
  options: unknown;
  validation: unknown;
}

export interface TrailLessonResponse {
  id: string;
  title: string;
  sequence: number;
  xpReward: number;
  questions: TrailQuestionResponse[];
}

export interface TrailRecommendationResponse {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  lessons: TrailLessonResponse[];
}

export interface TrailLessonRequest {
  Params: { lessonId: string };
}
