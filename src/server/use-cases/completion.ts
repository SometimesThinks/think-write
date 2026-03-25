import { completeText } from '@/src/server/services/provider';

import type { AutocompleteRequest } from '@/src/shared/autocomplete';

// completion use-case 함수
export async function complete(request: AutocompleteRequest, requestId: string) {
  return completeText(request, requestId);
}
