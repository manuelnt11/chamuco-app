'use client';

import { useState, useEffect, useRef, type SubmitEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShareNetworkIcon,
  CopyIcon,
  CheckIcon,
  UploadSimpleIcon,
  PaperPlaneTiltIcon,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/components/ui/toast';
import { FieldMessage } from '@/components/ui/field-message';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { InvitationTokenContext } from '@chamuco/shared-types';
import {
  createInvitationToken,
  getOpenInvitationToken,
  toggleInvitationToken,
} from '@/services/invitation-tokens.service';

interface LinkData {
  token: string;
  url: string;
  isActive: boolean;
}

interface InvitationLinkWidgetProps {
  contextType: InvitationTokenContext;
  /** Required for trip and group contexts. Omit for referral. */
  contextId?: string;
  /** Unique suffix for the localStorage key (userId for referral, tripId/groupId otherwise). */
  storageId: string;
  /** Show disable/enable toggle. Use in member/participant management pages. */
  showToggle?: boolean;
}

const storageKey = (contextType: InvitationTokenContext, storageId: string) =>
  `chamuco_invite_${contextType}_${storageId}`;

function readCache(key: string): LinkData | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LinkData;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function InvitationLinkWidget({
  contextType,
  contextId,
  storageId,
  showToggle = false,
}: InvitationLinkWidgetProps) {
  const { t } = useTranslation();
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  // Targeted invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  const key = storageKey(contextType, storageId);

  useEffect(() => {
    const cached = readCache(key);
    if (cached) {
      setLinkData(cached);
      setIsLoadingExisting(false);
      return;
    }
    getOpenInvitationToken({ contextType, contextId })
      .then((result) => {
        if (result) {
          localStorage.setItem(key, JSON.stringify(result));
          setLinkData(result);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingExisting(false));
  }, [contextType, contextId, storageId, key]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  function handleInviteOpenChange(open: boolean) {
    setInviteOpen(open);
    if (!open) {
      setInviteEmail('');
      setInviteError(null);
      setInviteSent(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const result = await createInvitationToken({ contextType, contextId });
      localStorage.setItem(key, JSON.stringify(result));
      setLinkData(result);
    } catch {
      toast.error(t('invitationLink.generateError'));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!linkData) return;
    await navigator.clipboard.writeText(linkData.url);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (!linkData) return;
    try {
      await navigator.share({
        url: linkData.url,
        text: t(`invitationLink.shareText.${contextType}`),
      });
    } catch (err: unknown) {
      // AbortError = user dismissed the share sheet — not an error worth surfacing
      if ((err as { name?: string })?.name === 'AbortError') return;
      throw err;
    }
  }

  async function handleToggle() {
    if (!linkData) return;
    setIsToggling(true);
    try {
      await toggleInvitationToken(linkData.token);
      const updated = { ...linkData, isActive: !linkData.isActive };
      localStorage.setItem(key, JSON.stringify(updated));
      setLinkData(updated);
    } catch {
      toast.error(t('invitationLink.toggleError'));
    } finally {
      setIsToggling(false);
    }
  }

  async function handleSendInvite(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteError(null);
    setIsSendingInvite(true);
    try {
      await createInvitationToken({ contextType, contextId, recipientEmail: inviteEmail.trim() });
      setInviteSent(true);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setInviteError(t('invitationLink.invite.errorAlreadyRegistered'));
      } else {
        setInviteError(t('invitationLink.invite.errorGeneric'));
      }
    } finally {
      setIsSendingInvite(false);
    }
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShareNetworkIcon className="size-5 text-muted-foreground" aria-hidden="true" />
        <h3 className="font-semibold">{t('invitationLink.heading')}</h3>
      </div>

      {isLoadingExisting ? (
        <Spinner size="sm" />
      ) : !linkData ? (
        <>
          <p className="text-sm text-muted-foreground">
            {t(`invitationLink.description.${contextType}`)}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleGenerate()}
            disabled={isGenerating}
          >
            {isGenerating ? t('invitationLink.generating') : t('invitationLink.generate')}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{t('invitationLink.yourLink')}</p>
          <div className="flex gap-2">
            <Input
              value={linkData.url}
              readOnly
              disabled={!linkData.isActive}
              className="font-mono text-xs"
              aria-label={t('invitationLink.yourLink')}
            />
            {canShare ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void handleShare()}
                disabled={!linkData.isActive}
                title={t('invitationLink.share')}
                aria-label={t('invitationLink.share')}
              >
                <UploadSimpleIcon className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void handleCopy()}
                disabled={!linkData.isActive}
                title={copied ? t('invitationLink.copied') : t('invitationLink.copy')}
                aria-label={copied ? t('invitationLink.copied') : t('invitationLink.copy')}
              >
                {copied ? (
                  <CheckIcon className="size-4" aria-hidden="true" />
                ) : (
                  <CopyIcon className="size-4" aria-hidden="true" />
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setInviteOpen(true)}
              title={t('invitationLink.invite.button')}
              aria-label={t('invitationLink.invite.button')}
            >
              <PaperPlaneTiltIcon className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {showToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleToggle()}
              disabled={isToggling}
              className="text-xs text-muted-foreground"
            >
              {isToggling
                ? t('invitationLink.toggling')
                : linkData.isActive
                  ? t('invitationLink.disable')
                  : t('invitationLink.enable')}
            </Button>
          )}
        </>
      )}

      <Dialog open={inviteOpen} onOpenChange={handleInviteOpenChange}>
        <DialogPopup>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>{t('invitationLink.invite.title')}</DialogTitle>
            <DialogDescription>{t('invitationLink.invite.description')}</DialogDescription>
          </DialogHeader>

          {inviteSent ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-foreground">{t('invitationLink.invite.success')}</p>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleInviteOpenChange(false)}
                >
                  {t('invitationLink.invite.close')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSendInvite(e)} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">{t('invitationLink.invite.emailLabel')}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError(null);
                  }}
                  placeholder={t('invitationLink.invite.emailPlaceholder')}
                  disabled={isSendingInvite}
                  aria-invalid={inviteError !== null}
                  autoComplete="email"
                />
                <FieldMessage error={inviteError} />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleInviteOpenChange(false)}
                  disabled={isSendingInvite}
                >
                  {t('actions.cancel')}
                </Button>
                <Button type="submit" disabled={isSendingInvite || !inviteEmail.trim()}>
                  {isSendingInvite
                    ? t('invitationLink.invite.sending')
                    : t('invitationLink.invite.send')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogPopup>
      </Dialog>
    </div>
  );
}
