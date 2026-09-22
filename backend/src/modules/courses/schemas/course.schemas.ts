export interface CourseRecommendation {
  id: string;
  thumbnail: string;
  title: string;
  provider: string;
  level: string;
  external_url: string;
  tags: string[];
  userRating: {
    rating: number;
    comment: string | null;
    matchedProfile: boolean | null;
  } | null;
}

export interface CourseRatingRequest {
  Params: { courseId: string };
  Body: { rating: number; comment?: string; matchedProfile?: boolean };
}

export interface CourseRecommendationsResponse {
  hasDiagnosis: boolean;
  areaPrincipal: string;
  courses: CourseRecommendation[];
}
