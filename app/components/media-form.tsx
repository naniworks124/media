'use client';

import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { MediaSkeleton } from '~/components/media-skeleton';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from '~/components/ui/input-group';
import { useClipboardSuggestion } from '~/hooks/use-clipboard-suggestion';

import { useHapticFeedback } from '../hooks/use-haptic';
import { MediaView } from './media-view';

// Separate component to utilize useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <InputGroupButton type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowRight className="h-4 w-4" />
      )}
      <span className="sr-only">Analyze</span>
    </InputGroupButton>
  );
}

type FormState = {
  results: Record<string, string> | null;
  error: string | null;
  status: string;
  url?: string;
  duration?: number | null;
};

const initialState: FormState = {
  results: null,
  error: null,
  status: '',
  duration: null,
};

export function MediaForm() {
  const { triggerCreativeSuccess, triggerError } = useHapticFeedback();
  const [state, formAction, isPending] = useActionState(
    async (_prevState: FormState, formData: FormData): Promise<FormState> => {
      const url = formData.get('url') as string;
      if (!url) {
        return {
          results: null,
          error: 'Please enter a valid URL.',
          status: '',
        };
      }

      const startTime = performance.now();

      try {
        const response = await fetch(
          `/resource/analyze?url=${encodeURIComponent(url)}&format=json,text`,
        );

        const contentType = response.headers.get('content-type');
        let data: { results?: Record<string, string>; error?: string } = {};

        if (contentType && contentType.includes('application/json')) {
          data = (await response.json()) as {
            results?: Record<string, string>;
            error?: string;
          };
        } else {
          const text = await response.text();
          if (!response.ok) {
            throw new Error(
              `Server Error (${response.status}): Analysis failed.`,
            );
          }
          console.error('Unexpected response:', text);
          throw new Error('Invalid server response.');
        }

        if (!response.ok || data.error) {
          throw new Error(
            data.error || 'Unable to analyze this URL.',
          );
        }

        const endTime = performance.now();

        triggerCreativeSuccess();

        return {
          results: data.results || null,
          error: null,
          status: 'Done',
          url,
          duration: endTime - startTime,
        };
      } catch (err) {
        triggerError();
        return {
          results: null,
          error: err instanceof Error ? err.message : 'Analysis Failed',
          status: 'Failed',
          url,
        };
      }
    },
    initialState,
  );

  const { clipboardUrl, ignoreClipboard } = useClipboardSuggestion(state.url);

  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center py-10">
      <div className="relative w-full max-w-5xl sm:p-12">
        <div className="relative z-10 space-y-10">
          <div>
            {/* Title */}
            <div className="flex items-center justify-between">
              <a href="/" className="no-underline">
                <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                  Naa Media
                </h1>
              </a>
            </div>

            {/* Description */}
            <div className="flex w-full items-center justify-between gap-2">
              <p className="text-muted-foreground leading-7">
                Get Info
              </p>
            </div>
          </div>

          <form action={formAction} className="relative space-y-8">
            <AnimatePresence>
              {clipboardUrl && (
                <motion.div
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex w-full justify-start overflow-hidden"
                >
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      ignoreClipboard();
                      const form = e.currentTarget.closest('form');
                      if (form) {
                        const input = form.querySelector(
                          'input[name="url"]',
                        ) as HTMLInputElement;
                        if (input) {
                          input.value = clipboardUrl;
                          form.requestSubmit();
                        }
                      }
                    }}
                    className="hover:bg-muted/50 group flex max-w-full flex-col items-start gap-1 rounded-xl px-4 py-3 text-left"
                  >
                    <span className="text-muted-foreground text-xs font-medium uppercase">
                      Link from Clipboard
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-2 text-sm font-medium break-all">
                        {clipboardUrl}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <InputGroup>
              <InputGroupInput
                name="url"
                placeholder="https://example.com/video.mp4"
                autoComplete="off"
                key={state.url}
                defaultValue={state.url || ''}
                required
              />
              <SubmitButton />
            </InputGroup>
          </form>

          {!isPending && state.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {isPending && <MediaSkeleton />}

      {state.results && !isPending && (
        <div className="w-full max-w-5xl sm:px-12 mt-8">
          <MediaView data={state.results} url={state.url || ''} />
        </div>
      )}
    </div>
  );
}
