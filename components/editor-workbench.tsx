'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DebugPanel } from '@/components/debug-panel';
import {
  SettingsModal,
  type SettingsScreen,
} from '@/components/settings-modal';
import {
  AUTOCOMPLETE_PREFIX_MAX_LENGTH,
  AUTOCOMPLETE_SUFFIX_MAX_LENGTH,
  type AutocompleteRequest,
  type AutocompleteResponse,
  type LanguageSettings,
} from '@/src/shared/autocomplete';
import { validateAutocompleteRequest } from '@/src/shared/validate-autocomplete-request';

const LANGUAGE_STORAGE_KEY = 'thinkwrite-language-settings';
const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  nativeLanguage: 'ko',
  targetLanguage: 'en',
};
const GHOST_CURSOR_DWELL_MS = 3000;
// todo: 초기값 변경
const INITIAL_CONTENT = '<p>I want to keep writing in English without losing my flow.</p>';

type EditorSnapshot = {
  documentText: string;
  paragraphText: string;
  prefix: string;
  suffix: string;
  selectionStart: number;
  selectionEnd: number;
};

type GhostPosition = {
  top: number;
  left: number;
};

// 설정 언어 설정 읽기
function readStoredLanguageSettings(): LanguageSettings {
  // SSR일 때 window 객체에 접근하는 것을 방지
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE_SETTINGS;
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (!stored) {
    return DEFAULT_LANGUAGE_SETTINGS;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<LanguageSettings>;

    if (typeof parsed.nativeLanguage === 'string' && typeof parsed.targetLanguage === 'string') {
      return {
        nativeLanguage: parsed.nativeLanguage,
        targetLanguage: parsed.targetLanguage,
      };
    }
  } catch {
    window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  }

  return DEFAULT_LANGUAGE_SETTINGS;
}

function trimPrefix(value: string) {
  return value.slice(-AUTOCOMPLETE_PREFIX_MAX_LENGTH);
}

function trimSuffix(value: string) {
  return value.slice(0, AUTOCOMPLETE_SUFFIX_MAX_LENGTH);
}

type ParagraphContext = {
  paragraphText: string;
  prefix: string;
  suffix: string;
};

// 현재 문단 컨텍스트 읽기 함수
function readParagraphContext(
  editor: NonNullable<ReturnType<typeof useEditor>>,
): ParagraphContext {
  const { doc, selection } = editor.state;
  const { $from, to } = selection;

  for (let depth = $from.depth; depth >= 0; depth -= 1) {
    const node = $from.node(depth);

    if (node.type.name !== 'paragraph') {
      continue;
    }

    const paragraphStart = $from.start(depth);
    const paragraphEnd = $from.end(depth);
    const prefixEnd = Math.min(selection.from, paragraphEnd);
    const suffixStart = Math.min(Math.max(to, paragraphStart), paragraphEnd);

    return {
      paragraphText: doc.textBetween(paragraphStart, paragraphEnd, '\n', '\n'),
      prefix: doc.textBetween(paragraphStart, prefixEnd, '\n', '\n'),
      suffix: doc.textBetween(suffixStart, paragraphEnd, '\n', '\n'),
    };
  }

  return {
    paragraphText: '',
    prefix: '',
    suffix: '',
  };
}

// editor 스냅샷 생성 함수
function createEditorSnapshot(editor: NonNullable<ReturnType<typeof useEditor>>): EditorSnapshot {
  const { doc, selection } = editor.state;
  const documentText = doc.textBetween(0, doc.content.size, '\n\n', '\n');
  const paragraphContext = readParagraphContext(editor);

  return {
    documentText,
    paragraphText: paragraphContext.paragraphText,
    prefix: paragraphContext.prefix,
    suffix: paragraphContext.suffix,
    selectionStart: selection.from,
    selectionEnd: selection.to,
  };
}

// 자동 완성 요청 생성 함수
function createAutocompleteRequest(
  snapshot: EditorSnapshot,
  languageSettings: LanguageSettings,
): AutocompleteRequest {
  return {
    prefix: trimPrefix(snapshot.prefix),
    suffix: trimSuffix(snapshot.suffix),
    languageSettings,
  };
}

function isAutocompleteResponse(input: unknown): input is AutocompleteResponse {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const response = input as Partial<AutocompleteResponse>;

  return typeof response.output === 'string' && typeof response.requestId === 'string';
}

function SettingsIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      className='h-5 w-5'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M10.325 4.317a1 1 0 0 1 1.35-.936l.41.163a1 1 0 0 0 .83 0l.41-.163a1 1 0 0 1 1.35.936l.054.438a1 1 0 0 0 .59.79l.402.18a1 1 0 0 1 .49 1.308l-.174.415a1 1 0 0 0 .072.91l.244.367a1 1 0 0 1-.2 1.383l-.355.263a1 1 0 0 0-.406.82l-.022.448a1 1 0 0 1-1.12 1.108l-.446-.043a1 1 0 0 0-.852.328l-.304.329a1 1 0 0 1-1.397.056l-.33-.301a1 1 0 0 0-.862-.246l-.442.08a1 1 0 0 1-1.202-1.018l-.06-.445a1 1 0 0 0-.476-.778l-.382-.235a1 1 0 0 1-.36-1.351l.213-.395a1 1 0 0 0 .016-.913l-.2-.401a1 1 0 0 1 .402-1.337l.388-.224a1 1 0 0 0 .497-.764l.093-.438Z'
      />
      <circle cx='12' cy='12' r='2.75' />
    </svg>
  );
}

export function EditorWorkbench() {
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>(
    readStoredLanguageSettings,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [settingsScreen, setSettingsScreen] = useState<SettingsScreen>('list');
  const [ghostReadyContextKey, setGhostReadyContextKey] = useState<string | null>(null);
  const [isGhostVisible, setIsGhostVisible] = useState<boolean>(false);
  const [ghostText, setGhostText] = useState<string | null>(null);
  const [ghostPosition, setGhostPosition] = useState<GhostPosition | null>(null);
  const lastRequestedKeyRef = useRef<string | null>(null);
  const ghostTextRef = useRef<string | null>(ghostText);
  const isGhostVisibleRef = useRef<boolean>(isGhostVisible);
  const editorSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [snapshot, setSnapshot] = useState<EditorSnapshot>({
    documentText: '',
    paragraphText: '',
    prefix: '',
    suffix: '',
    selectionStart: 0,
    selectionEnd: 0,
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        hardBreak: false,
        heading: false,
        horizontalRule: false,
        listItem: false,
        orderedList: false,
      }),
    ],
    content: INITIAL_CONTENT,
    editorProps: {
      attributes: {
        class:
          'h-full min-h-full outline-none text-lg leading-8 text-zinc-900 whitespace-pre-wrap break-words',
      },
      handleKeyDown(_view, event) {
        if (!isGhostVisibleRef.current) {
          return false;
        }

        if (event.key === 'Tab') {
          event.preventDefault();
          console.log('[ghost] tab accept placeholder', {
            ghostText: ghostTextRef.current,
          });

          return true;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          console.log('[ghost] escape dismiss placeholder', {
            ghostText: ghostTextRef.current,
          });

          return true;
        }

        return false;
      },
    },
    onCreate({ editor }) {
      editor.commands.focus('end');
      setSnapshot(createEditorSnapshot(editor));
    },
    onUpdate({ editor }) {
      setSnapshot(createEditorSnapshot(editor));
    },
    onSelectionUpdate({ editor }) {
      setSnapshot(createEditorSnapshot(editor));
    },
  });

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(languageSettings));
  }, [languageSettings]);

  useEffect(() => {
    ghostTextRef.current = ghostText;
    isGhostVisibleRef.current = isGhostVisible;
  }, [ghostText, isGhostVisible]);

  useEffect(() => {
    if (!editor || !editorSurfaceRef.current || !isGhostVisible || !ghostText) {
      return;
    }

    const activeEditor: NonNullable<typeof editor> = editor;

    function updateGhostPosition() {
      if (!editorSurfaceRef.current) {
        return;
      }

      const cursorCoords = activeEditor.view.coordsAtPos(activeEditor.state.selection.from);
      const surfaceRect = editorSurfaceRef.current.getBoundingClientRect();

      setGhostPosition({
        top: cursorCoords.top - surfaceRect.top,
        left: cursorCoords.left - surfaceRect.left,
      });
    }

    updateGhostPosition();
    window.addEventListener('resize', updateGhostPosition);

    return () => {
      window.removeEventListener('resize', updateGhostPosition);
    };
  }, [editor, ghostText, isGhostVisible, snapshot.selectionEnd, snapshot.selectionStart]);

  // todo: useMemo 필요성 검토
  const requestPreview = useMemo(
    () => createAutocompleteRequest(snapshot, languageSettings),
    [languageSettings, snapshot],
  );
  // todo: useMemo 필요성 검토
  const requestValidation = useMemo(
    () => validateAutocompleteRequest(requestPreview),
    [requestPreview],
  );
  const isSelectionCollapsed = snapshot.selectionStart === snapshot.selectionEnd;
  const ghostContextKey = [
    snapshot.paragraphText,
    snapshot.prefix,
    snapshot.suffix,
    snapshot.selectionStart,
    snapshot.selectionEnd,
  ].join('::');
  const requestKey = useMemo(() => JSON.stringify(requestPreview), [requestPreview]);
  const isGhostEligible =
    isSelectionCollapsed && ghostReadyContextKey === ghostContextKey;

  useEffect(() => {
    if (!isSelectionCollapsed) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGhostReadyContextKey(ghostContextKey);
    }, GHOST_CURSOR_DWELL_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [ghostContextKey, isSelectionCollapsed]);

  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();

    async function syncGhostState() {
      if (!isGhostEligible || !requestValidation.ok) {
        lastRequestedKeyRef.current = null;
        setGhostText(null);
        setIsGhostVisible(false);
        return;
      }

      if (lastRequestedKeyRef.current === requestKey) {
        console.log('[ghost] duplicate request skipped', {
          requestKey,
        });
        return;
      }

      lastRequestedKeyRef.current = requestKey;

      try {
        const response = await fetch('/api/completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPreview),
          signal: abortController.signal,
        });
        const payload: unknown = await response.json();

        if (isCancelled) {
          return;
        }

        if (!response.ok || !isAutocompleteResponse(payload) || !payload.output.trim()) {
          setGhostText(null);
          setIsGhostVisible(false);
          console.log('[ghost] completion request failed', {
            payload,
            requestKey,
            status: response.status,
          });
          return;
        }

        setGhostText(payload.output);
        setIsGhostVisible(true);
        console.log('[ghost] completion request success', {
          output: payload.output,
          requestKey,
          requestId: payload.requestId,
        });
      } catch (error) {
        if (abortController.signal.aborted || isCancelled) {
          return;
        }

        setGhostText(null);
        setIsGhostVisible(false);
        console.log('[ghost] completion request error', {
          error,
          requestKey,
        });
      }
    }

    void syncGhostState();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [isGhostEligible, requestKey, requestPreview, requestValidation]);

  return (
    <main className='flex min-h-screen flex-col bg-zinc-950 text-zinc-50'>
      <section className='flex w-full flex-1 flex-col gap-6 px-6 py-8 lg:px-10'>
        <header className='rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur'>
          <div className='flex items-start justify-between gap-4'>
            <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>ThinkWrite</h1>

            <div className='flex items-center gap-2'>
              <button
                type='button'
                aria-pressed={isDebugOpen}
                className='inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-zinc-200 transition hover:bg-white/10'
                onClick={() => {
                  setIsDebugOpen((prev) => !prev);
                }}
              >
                Debug
              </button>
              <button
                type='button'
                aria-label='설정'
                aria-haspopup='dialog'
                aria-expanded={isSettingsOpen}
                className='inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10'
                onClick={() => {
                  setSettingsScreen('list');
                  setIsSettingsOpen(true);
                }}
              >
                <SettingsIcon />
              </button>
            </div>
          </div>
        </header>

        <div className='flex flex-1'>
          <section className='flex min-h-[640px] w-full flex-col rounded-[32px] border border-white/10 bg-white p-6 text-zinc-950 shadow-2xl shadow-black/20'>
            <div className='flex flex-1 flex-col gap-6'>
              <div
                ref={editorSurfaceRef}
                className='relative flex min-h-[420px] flex-1 flex-col rounded-3xl border border-zinc-200 bg-zinc-50 p-5 pb-14'
              >
                <EditorContent editor={editor} className='h-full flex-1' />
                {ghostPosition && ghostText && isGhostVisible && (
                  <div
                    className='pointer-events-none absolute z-10 max-w-[calc(100%-2.5rem)] text-lg leading-8 whitespace-pre-wrap text-zinc-400/80'
                    style={{
                      left: ghostPosition.left,
                      top: ghostPosition.top,
                    }}
                  >
                    {ghostText}
                  </div>
                )}
                <div className='absolute right-5 bottom-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm'>
                  {snapshot.documentText.length} chars
                </div>
              </div>

              <DebugPanel
                ghostText={ghostText}
                isOpen={isDebugOpen}
                isGhostEligible={isGhostEligible}
                isGhostVisible={isGhostVisible}
                isSelectionCollapsed={isSelectionCollapsed}
                ghostCursorDwellMs={GHOST_CURSOR_DWELL_MS}
                requestPreview={requestPreview}
                requestValidation={requestValidation}
              />
            </div>
          </section>
        </div>
      </section>

      <SettingsModal
        isOpen={isSettingsOpen}
        languageSettings={languageSettings}
        settingsScreen={settingsScreen}
        onClose={() => {
          setSettingsScreen('list');
          setIsSettingsOpen(false);
        }}
        onOpenLanguage={() => {
          setSettingsScreen('language');
        }}
        onBack={() => {
          setSettingsScreen('list');
        }}
        onNativeLanguageChange={(value) => {
          setLanguageSettings((prev) => ({ ...prev, nativeLanguage: value }));
        }}
        onTargetLanguageChange={(value) => {
          setLanguageSettings((prev) => ({ ...prev, targetLanguage: value }));
        }}
      />
    </main>
  );
}
