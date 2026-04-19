'use client';

import {
  AUTOCOMPLETE_PREFIX_MAX_LENGTH,
  AUTOCOMPLETE_SUFFIX_MAX_LENGTH,
  type AutocompleteRequest,
} from '@/src/shared/autocomplete';
import { validateAutocompleteRequest } from '@/src/shared/validate-autocomplete-request';

type DebugPanelProps = {
  ghostText: string | null;
  isOpen: boolean;
  isGhostEligible: boolean;
  isGhostVisible: boolean;
  isSelectionCollapsed: boolean;
  ghostCursorDwellMs: number;
  requestPreview: AutocompleteRequest;
  requestValidation: ReturnType<typeof validateAutocompleteRequest>;
};

export function DebugPanel({
  ghostText,
  isOpen,
  isGhostEligible,
  isGhostVisible,
  isSelectionCollapsed,
  ghostCursorDwellMs,
  requestPreview,
  requestValidation,
}: DebugPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
      <div className='rounded-3xl border border-dashed border-zinc-300 p-5'>
        <div className='mb-3 text-sm font-semibold'>Debug inspection</div>
        <div className='grid gap-3 md:grid-cols-2'>
          <div className='rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-200'>
            <div className='mb-2 font-medium text-white'>prefix</div>
            <div className='mb-2 text-xs text-zinc-400'>
              {requestPreview.prefix.length} / {AUTOCOMPLETE_PREFIX_MAX_LENGTH} chars
            </div>
            <pre className='max-h-56 overflow-auto text-xs leading-5 break-words whitespace-pre-wrap text-zinc-300'>
              {requestPreview.prefix || '(empty)'}
            </pre>
          </div>

          <div className='rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-200'>
            <div className='mb-2 font-medium text-white'>suffix</div>
            <div className='mb-2 text-xs text-zinc-400'>
              {requestPreview.suffix.length} / {AUTOCOMPLETE_SUFFIX_MAX_LENGTH} chars
            </div>
            <pre className='max-h-56 overflow-auto text-xs leading-5 break-words whitespace-pre-wrap text-zinc-300'>
              {requestPreview.suffix || '(empty)'}
            </pre>
          </div>
        </div>
      </div>

      <div className='rounded-3xl bg-zinc-950 p-5 text-sm text-zinc-200'>
        <div className='mb-3 flex items-center justify-between'>
          <div className='font-semibold text-white'>Debug preview</div>
          <span className='rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300'>
            {requestValidation.ok ? 'valid' : 'invalid'}
          </span>
        </div>
        <div className='space-y-3'>
          <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
            <div className='text-xs text-zinc-500'>nativeLanguage</div>
            <div className='mt-1 font-medium text-white'>
              {requestPreview.languageSettings.nativeLanguage}
            </div>
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
            <div className='text-xs text-zinc-500'>targetLanguage</div>
            <div className='mt-1 font-medium text-white'>
              {requestPreview.languageSettings.targetLanguage}
            </div>
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
            <div className='text-xs text-zinc-500'>validation</div>
            <div className='mt-1 font-medium text-white'>
              {requestValidation.ok ? 'valid request' : 'invalid request'}
            </div>
            {!requestValidation.ok && (
              <div className='mt-2 text-xs leading-5 text-amber-200'>
                {requestValidation.message}
              </div>
            )}
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
            <div className='text-xs text-zinc-500'>ghost eligibility</div>
            <div className='mt-1 font-medium text-white'>
              {isGhostEligible ? 'ready after dwell' : 'not ready'}
            </div>
            <div className='mt-2 text-xs leading-5 text-zinc-400'>
              {isSelectionCollapsed
                ? `collapsed selection + ${ghostCursorDwellMs / 1000}s dwell rule`
                : 'selection range exists, so ghost stays hidden'}
            </div>
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
            <div className='text-xs text-zinc-500'>ghost visibility</div>
            <div className='mt-1 font-medium text-white'>
              {isGhostVisible ? 'visible' : 'hidden'}
            </div>
            <div className='mt-2 text-xs leading-5 text-zinc-400'>{ghostText ?? '(empty)'}</div>
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/5 p-3'>
            <div className='text-xs text-zinc-500'>payload</div>
            <pre className='mt-2 text-xs leading-5 break-words whitespace-pre-wrap text-zinc-300'>
              {JSON.stringify(requestPreview, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
