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
const INITIAL_CONTENT = `
<p>I want to explain my idea more clearly, but I often stop because I cannot find the next sentence in English.</p>
<p>Maybe I need a tool that helps me continue the draft without breaking my flow.</p>
`;

type EditorSnapshot = {
  documentText: string;
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

// editor 스냅샷 생성 함수
function createEditorSnapshot(editor: NonNullable<ReturnType<typeof useEditor>>): EditorSnapshot {
  const { doc, selection } = editor.state;
  const documentText = doc.textBetween(0, doc.content.size, '\n\n', '\n');
  const prefix = doc.textBetween(0, selection.from, '\n\n', '\n');
  const suffix = doc.textBetween(selection.to, doc.content.size, '\n\n', '\n');

  return {
    documentText,
    prefix,
    suffix,
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

export function EditorWorkbench() {
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>(
    readStoredLanguageSettings,
  );
  const [snapshot, setSnapshot] = useState<EditorSnapshot>({
    documentText: '',
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
          'min-h-[320px] outline-none text-lg leading-8 text-zinc-900 whitespace-pre-wrap break-words',
      },
    },
    onCreate({ editor }) {
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

  const hasSelection = snapshot.selectionStart !== snapshot.selectionEnd;
  const isLanguageReady =
    languageSettings.nativeLanguage.trim().length > 0 &&
    languageSettings.targetLanguage.trim().length > 0;

  return (
    <main className='flex min-h-screen flex-col bg-zinc-950 text-zinc-50'>
      <section className='mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 lg:px-10'>
        <header className='flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur'>
          <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
            <div className='space-y-3'>
              <span className='inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-200 uppercase'>
                ThinkWrite MVP
              </span>
              <div className='space-y-2'>
                <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>
                  글쓰기 흐름을 끊지 않는 AI writing editor
                </h1>
                <p className='max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base'>
                  편집기 안에서 prefix / suffix 기반 자동완성 요청을 직접 만들고 검증하는 단계다.
                  현재는 에디터 연결, 텍스트 상태 관리, request inspection부터 맞춘다.
                </p>
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-3 lg:min-w-[360px]'>
              {['학습 언어 설정', 'Ghost Complete 프로토타입', '.env 기반 provider 연동'].map(
                (item) => (
                  <div
                    key={item}
                    className='rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200'
                  >
                    <div className='mb-2 text-xs tracking-wide text-zinc-500 uppercase'>MVP</div>
                    <div className='font-medium'>{item}</div>
                  </div>
                ),
              )}
            </div>
          </div>
        </header>

        <div className='grid flex-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]'>
          <aside className='space-y-4'>
            <section className='rounded-3xl border border-white/10 bg-white p-5 text-zinc-950 shadow-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-sm font-semibold tracking-wide uppercase'>Language setup</h2>
                <span className='rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600'>
                  local state
                </span>
              </div>

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
            </section>

            <section className='rounded-3xl border border-white/10 bg-white p-5 text-zinc-950 shadow-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-sm font-semibold tracking-wide uppercase'>Editor state</h2>
                <span className='rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700'>
                  live
                </span>
              </div>

              <div className='space-y-3 text-sm'>
                <div className='rounded-2xl border border-zinc-200 p-3'>
                  <div className='text-xs text-zinc-500'>문서 길이</div>
                  <div className='mt-1 font-medium text-zinc-900'>
                    {snapshot.documentText.length} chars
                  </div>
                </div>
                <div className='rounded-2xl border border-zinc-200 p-3'>
                  <div className='text-xs text-zinc-500'>선택 범위</div>
                  <div className='mt-1 font-medium text-zinc-900'>
                    {snapshot.selectionStart} → {snapshot.selectionEnd}
                  </div>
                </div>
                <div className='rounded-2xl border border-zinc-200 p-3'>
                  <div className='text-xs text-zinc-500'>Ghost 트리거 준비</div>
                  <div className='mt-1 font-medium text-zinc-900'>
                    {isLanguageReady ? 'ready' : 'blocked'} / {hasSelection ? 'selection' : 'caret'}
                  </div>
                </div>
              </div>
            </section>

            <section className='rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-200'>
              <h2 className='mb-3 font-semibold tracking-wide uppercase'>Ghost interaction</h2>
              <ul className='space-y-2 text-zinc-300'>
                {[
                  '입력을 멈추면 문맥 기반 제안 생성',
                  'Tab으로 제안 수락',
                  'Esc 또는 추가 입력 시 제안 무효화',
                ].map((item) => (
                  <li key={item} className='flex gap-2'>
                    <span className='mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300' />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          <section className='flex min-h-[640px] flex-col rounded-[32px] border border-white/10 bg-white text-zinc-950 shadow-2xl shadow-black/20'>
            <div className='flex items-center justify-between border-b border-zinc-200 px-6 py-4'>
              <div>
                <div className='text-sm font-semibold'>Editor</div>
                <div className='text-xs text-zinc-500'>
                  Tiptap 기반 text-first editor와 completion request inspection
                </div>
              </div>
              <div className='flex items-center gap-2 text-xs text-zinc-500'>
                <span className='rounded-full bg-zinc-100 px-3 py-1'>idle</span>
                <span className='rounded-full bg-zinc-100 px-3 py-1'>request preview</span>
                <span className='rounded-full bg-zinc-100 px-3 py-1'>validation</span>
              </div>
            </div>

            <div className='flex flex-1 flex-col gap-6 p-6'>
              <div className='rounded-3xl border border-zinc-200 bg-zinc-50 p-5'>
                <EditorContent editor={editor} />
              </div>

              <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]'>
                <div className='rounded-3xl border border-dashed border-zinc-300 p-5'>
                  <div className='mb-3 text-sm font-semibold'>Request inspection</div>
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
                  <div className='mb-3 font-semibold text-white'>Request preview</div>
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
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
