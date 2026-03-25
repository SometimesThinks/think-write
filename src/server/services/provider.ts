import { generateText } from '@/src/server/providers/adapter';

import type { AutocompleteRequest } from '@/src/shared/autocomplete';

// provider 호출 service 함수
export async function completeText(request: AutocompleteRequest, requestId: string) {
  return generateText(request, requestId);
}
