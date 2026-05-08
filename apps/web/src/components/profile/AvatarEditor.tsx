'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getTwemojiUrl } from '@chamuco/shared-utils';
import { UploadType } from '@chamuco/shared-types';

import { Avatar } from '@/components/ui/avatar';
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
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUser } from '@/hooks/useUser';
import type { AppUser } from '@/store/user';
import { getInitials } from '@/lib/name-utils';
import { AVATAR_EMOJIS } from '@/lib/avatar-emojis';
import { CropModal } from '@/components/ui/crop-modal';

type Tab = 'photo' | 'emoji';

interface AvatarEditorProps {
  user: AppUser;
}

export function AvatarEditor({ user }: AvatarEditorProps) {
  const { t } = useTranslation(['profile', 'common']);
  const { refresh } = useUser();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('photo');
  const [isSaving, setIsSaving] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, progress, isUploading } = useFileUpload({
    uploadType: UploadType.USER_AVATAR,
    contextId: user.id,
  });

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCropFile(file);
  }

  async function handleCropConfirm(blob: Blob) {
    setIsSaving(true);
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const objectKey = await upload(file);
      await apiClient.patch('/v1/users/me/avatar', {
        source: 'gcs',
        target: objectKey,
        fileSize: blob.size,
      });
      toast.success(t('basicInfo.avatarEditor.photoSuccess'));
      await refresh();
      setCropFile(null);
      setOpen(false);
    } catch {
      toast.error(t('basicInfo.avatarEditor.photoError'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleCropCancel() {
    setCropFile(null);
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

  function handleOpenChange(next: boolean) {
    if (!next) setCropFile(null);
    setOpen(next);
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar
        src={user.avatar?.url ?? undefined}
        alt=""
        fallback={getInitials(user.displayName)}
        size="lg"
      />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger className="text-sm font-medium underline-offset-2 hover:underline">
          {t('basicInfo.avatarEditor.editButton')}
        </DialogTrigger>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{t('basicInfo.avatarEditor.editButton')}</DialogTitle>
          </DialogHeader>
          <DialogClose />

          {cropFile ? (
            <CropModal
              file={cropFile}
              onConfirm={(blob) => void handleCropConfirm(blob)}
              onCancel={handleCropCancel}
              isConfirming={isSaving}
              uploadProgress={progress}
              isUploading={isUploading}
              title={t('basicInfo.avatarEditor.cropEditor.title')}
              confirmLabel={t('basicInfo.avatarEditor.cropEditor.usePhoto')}
              circular
              outputWidth={256}
            />
          ) : (
            <>
              {user.avatar && (
                <div className="mt-6 flex items-center gap-3">
                  <Avatar
                    src={user.avatar.url ?? undefined}
                    alt=""
                    fallback={getInitials(user.displayName)}
                    size="lg"
                  />
                  <span className="text-sm text-muted-foreground">
                    {t('basicInfo.avatarEditor.cropEditor.currentAvatar')}
                  </span>
                </div>
              )}

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
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                      {t('common:upload.chooseFile')}
                    </button>
                  </>
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
            </>
          )}
        </DialogPopup>
      </Dialog>
    </div>
  );
}
