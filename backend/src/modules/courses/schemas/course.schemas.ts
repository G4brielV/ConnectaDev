export interface CourseRecommendation {
  id: string;
  thumbnail: string;
  title: string;
  provider: string;
  level: string;
  tags: string[];
}

export interface CourseRecommendationsResponse {
  areaPrincipal: string;
  courses: CourseRecommendation[];
}
