'use client';

import { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ShareNetworkIcon, XIcon } from '@phosphor-icons/react';

const STORAGE_KEY = 'chamuco_pwa_prompt_dismissed_at';
const COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const PERMANENT_SUPPRESS = String(Number.MAX_SAFE_INTEGER);

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|gsa/i.test(ua);
  return isIos && isSafari;
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  if ('userAgentData' in navigator) {
    return (navigator as { userAgentData?: { mobile: boolean } }).userAgentData?.mobile ?? false;
  }
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function shouldShow(): boolean {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return true;
  return Date.now() - Number(raw) < COOLDOWN_MS ? false : true;
}

export function IosPwaPrompt() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (!isMobileDevice()) return;
    if (!shouldShow()) return;

    if (isIosSafari()) {
      setIsIos(true);
      setVisible(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setIsIos(false);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, PERMANENT_SUPPRESS);
    } else {
      dismiss();
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('installPrompt.title')}
      className="fixed bottom-0 inset-x-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="relative rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-700 p-4 flex flex-col gap-3">
        <button
          type="button"
          aria-label={t('installPrompt.dismiss')}
          onClick={dismiss}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <XIcon className="size-5" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <img
            src="/apple-touch-icon.png"
            alt=""
            aria-hidden="true"
            className="size-12 rounded-xl shadow-sm shrink-0"
          />
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {t('installPrompt.title')}
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
              {t('installPrompt.description')}
            </p>
          </div>
        </div>

        {isIos ? (
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300">
            <Trans
              i18nKey="installPrompt.instruction"
              components={{
                shareIcon: (
                  <ShareNetworkIcon
                    weight="bold"
                    className="inline size-[1.1em] text-sky-500 align-[-0.125em] shrink-0"
                  />
                ),
              }}
            />
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {t('installPrompt.dismiss')}
            </button>
            <button
              type="button"
              onClick={() => void install()}
              className="flex-1 rounded-xl bg-sky-500 hover:bg-sky-600 text-white py-2 text-sm font-medium transition-colors"
            >
              {t('installPrompt.install')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
