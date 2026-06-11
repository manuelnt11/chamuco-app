export interface FeedbackPayload {
  comment: string;
  currentPage: string;
  userAgent: string;
  viewportSize: string;
  language: string;
  theme: string;
}

export interface FeedbackResponseDto {
  issueUrl: string;
}
