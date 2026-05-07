'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTwemojiUrl } from '@chamuco/shared-utils';
import { UploadType } from '@chamuco/shared-types';

import { Avatar } from '@/components/ui/avatar';
import { FileUploadButton } from '@/components/ui/file-upload-button';
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { apiClient } from '@/services/api-client';
import { useUser } from '@/hooks/useUser';
import type { AppUser } from '@/store/user';
import { getInitials } from '@/lib/name-utils';
import { AVATAR_EMOJIS } from '@/lib/avatar-emojis';

type Tab = 'photo' | 'emoji';

interface AvatarEditorProps {
  user: AppUser;
}

export function AvatarEditor({ user }: AvatarEditorProps) {
  const { t } = useTranslation('profile');
  const { refresh } = useUser();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('photo');
  const [isSaving, setIsSaving] = useState(false);

  async function handlePhotoSuccess(objectKey: string, fileSize: number) {
    setIsSaving(true);
    try {
      await apiClient.patch('/v1/users/me/avatar', { source: 'gcs', target: objectKey, fileSize });
      toast.success(t('basicInfo.avatarEditor.photoSuccess'));
      await refresh();
      setOpen(false);
    } catch {
      toast.error(t('basicInfo.avatarEditor.photoError'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEmojiSelect(emoji: string) {
    setIsSaving(true);
    try {
      await apiClient.patch('/v1/users/me/avatar', { source: 'emoji', target: emoji });
      toast.success(t('basicInfo.avatarEditor.emojiSuccess'));
      await refresh();
      setOpen(false);
    } catch {
      toast.error(t('basicInfo.avatarEditor.emojiError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar
        src={user.avatar?.url ?? undefined}
        alt=""
        fallback={getInitials(user.displayName)}
        size="lg"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="text-sm font-medium underline-offset-2 hover:underline">
          {t('basicInfo.avatarEditor.editButton')}
        </DialogTrigger>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{t('basicInfo.avatarEditor.editButton')}</DialogTitle>
          </DialogHeader>
          <DialogClose />

          <div className="mt-4 flex gap-2 border-b">
            <button
              type="button"
              onClick={() => setActiveTab('photo')}
              className={`pb-2 text-sm font-medium transition-colors ${
                activeTab === 'photo'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('basicInfo.avatarEditor.tabPhoto')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emoji')}
              className={`pb-2 text-sm font-medium transition-colors ${
                activeTab === 'emoji'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('basicInfo.avatarEditor.tabEmoji')}
            </button>
          </div>

          <div className="mt-4">
            {activeTab === 'photo' && (
              <FileUploadButton
                uploadType={UploadType.USER_AVATAR}
                contextId={user.id}
                onSuccess={handlePhotoSuccess}
                disabled={isSaving}
              />
            )}
            {activeTab === 'emoji' && (
              <div className="grid grid-cols-8 gap-2">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => void handleEmojiSelect(emoji)}
                    disabled={isSaving}
                    aria-label={emoji}
                    className="flex size-10 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-50"
                  >
                    <img
                      src={getTwemojiUrl(emoji)}
                      alt={emoji}
                      className="size-6"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
