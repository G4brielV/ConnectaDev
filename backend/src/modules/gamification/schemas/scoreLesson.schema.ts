export interface ScoreLessonRequest {
  Params: {
    lessonId: string;
  };
  Body: {
    answers: Record<string, string>;
  };
}