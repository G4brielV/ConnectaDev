export interface CourseRecommendation {
  id: string;
  thumbnail: string;
  title: string;
  provider: string;
  level: string;
  external_url: string;
  tags: string[];
}

export interface CourseRecommendationsResponse {
  hasDiagnosis: boolean;
  areaPrincipal: string;
  courses: CourseRecommendation[];
}
