import { apiClient } from '@/services/api-client';
import type { FeedbackPayload, FeedbackResponseDto } from '@/services/feedback.types';

export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResponseDto> {
  const { data } = await apiClient.post<FeedbackResponseDto>('/v1/feedback', payload);
  return data;
}
