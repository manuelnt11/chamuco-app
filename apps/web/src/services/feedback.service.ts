import { apiClient } from '@/services/api-client';
import type { FeedbackResponse } from '@chamuco/shared-types';
import type { FeedbackPayload } from '@/services/feedback.types';

export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
  const { data } = await apiClient.post<FeedbackResponse>('/v1/feedback', payload);
  return data;
}
