import { createNotImplementedResult } from '@/src/server/lib/route-result';

import type { AutocompleteRequest } from '@/src/shared/autocomplete';

// provider adapter 함수
export async function generateText(request: AutocompleteRequest, requestId: string) {
  return createNotImplementedResult(
    `Provider adapter skeleton is wired for prefix/suffix autocomplete, but completion is not implemented yet. Prefix=${request.prefix.length}, suffix=${request.suffix.length}.`,
    requestId,
  );
}
