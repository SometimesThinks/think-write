'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useState } from 'react';

import {
  AUTOCOMPLETE_PREFIX_MAX_LENGTH,
  AUTOCOMPLETE_SUFFIX_MAX_LENGTH,
  type AutocompleteRequest,
  type LanguageSettings,
} from '@/src/shared/autocomplete';
import { validateAutocompleteRequest } from '@/src/shared/validate-autocomplete-request';

const LANGUAGE_STORAGE_KEY = 'thinkwrite-language-settings';
const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  nativeLanguage: 'ko',
  targetLanguage: 'en',
};
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
// 언어 선택
function LanguageSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className='block rounded-2xl border border-zinc-200 p-3'>
      <div className='text-xs text-zinc-500'>{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none focus:border-emerald-400'
      >
        <option value='ko'>한국어</option>
        <option value='en'>영어</option>
        <option value='ja'>일본어</option>
        <option value='zh'>중국어</option>
      </select>
    </label>
  );
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

function DebugPanel({
  isOpen,
  requestPreview,
  requestValidation,
}: {
  isOpen: boolean;
  requestPreview: AutocompleteRequest;
  requestValidation: ReturnType<typeof validateAutocompleteRequest>;
}) {
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

export function EditorWorkbench() {
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>(
    readStoredLanguageSettings,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [settingsScreen, setSettingsScreen] = useState<'list' | 'language'>('list');
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
              <div className='relative flex min-h-[420px] flex-1 flex-col rounded-3xl border border-zinc-200 bg-zinc-50 p-5 pb-14'>
                <EditorContent editor={editor} className='h-full flex-1' />
                <div className='absolute right-5 bottom-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm'>
                  {snapshot.documentText.length} chars
                </div>
              </div>

              <DebugPanel
                isOpen={isDebugOpen}
                requestPreview={requestPreview}
                requestValidation={requestValidation}
              />
            </div>
          </section>
        </div>
      </section>

      {isSettingsOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 py-8'>
          <div className='w-full max-w-md rounded-[28px] border border-white/10 bg-zinc-950 p-6 text-zinc-50 shadow-2xl shadow-black/40'>
            <div className='mb-6 flex items-center justify-between gap-4'>
              <div className='flex items-center gap-3'>
                {settingsScreen === 'language' && (
                  <button
                    type='button'
                    aria-label='설정 목록으로 돌아가기'
                    className='inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10'
                    onClick={() => {
                      setSettingsScreen('list');
                    }}
                  >
                    ←
                  </button>
                )}
                <div className='text-lg font-semibold'>
                  {settingsScreen === 'list' ? 'Settings' : 'Language settings'}
                </div>
              </div>
              <button
                type='button'
                aria-label='설정 닫기'
                className='inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10'
                onClick={() => {
                  setSettingsScreen('list');
                  setIsSettingsOpen(false);
                }}
              >
                ✕
              </button>
            </div>

            {settingsScreen === 'list' ? (
              <div className='space-y-3'>
                <button
                  type='button'
                  className='flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10'
                  onClick={() => {
                    setSettingsScreen('language');
                  }}
                >
                  <div>
                    <div className='font-medium text-white'>언어 설정</div>
                    <div className='mt-1 text-sm text-zinc-400'>
                      {languageSettings.nativeLanguage} → {languageSettings.targetLanguage}
                    </div>
                  </div>
                  <span className='text-zinc-500'>→</span>
                </button>
              </div>
            ) : (
              <div className='space-y-3'>
                <LanguageSelect
                  label='모국어'
                  value={languageSettings.nativeLanguage}
                  onChange={(value) => {
                    setLanguageSettings((prev) => ({ ...prev, nativeLanguage: value }));
                  }}
                />
                <LanguageSelect
                  label='목표 언어'
                  value={languageSettings.targetLanguage}
                  onChange={(value) => {
                    setLanguageSettings((prev) => ({ ...prev, targetLanguage: value }));
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
