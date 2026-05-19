'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getTwemojiUrl } from '@chamuco/shared-utils';
import { UploadType } from '@chamuco/shared-types';

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
import { AVATAR_EMOJIS } from '@/lib/avatar-emojis';
import { CropModal } from '@/components/ui/crop-modal';

type Tab = 'photo' | 'emoji';

interface GroupCoverEditorProps {
  group: { id: string; coverUrl: string };
  onUpdate: () => void;
}

export function GroupCoverEditor({ group, onUpdate }: GroupCoverEditorProps) {
  const { t } = useTranslation(['groups', 'common']);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('photo');
  const [isSaving, setIsSaving] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, progress, isUploading } = useFileUpload({
    uploadType: UploadType.GROUP_COVER,
    contextId: group.id,
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
      const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
      const objectKey = await upload(file);
      await apiClient.patch(`/v1/groups/${group.id}`, {
        cover: { source: 'gcs', target: objectKey, fileSize: blob.size },
      });
      toast.success(t('cover.photoSuccess'));
      onUpdate();
      setCropFile(null);
      setOpen(false);
    } catch {
      toast.error(t('cover.photoError'));
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
      await apiClient.patch(`/v1/groups/${group.id}`, {
        cover: { source: 'emoji', target: emoji },
      });
      toast.success(t('cover.emojiSuccess'));
      onUpdate();
      setOpen(false);
    } catch {
      toast.error(t('cover.emojiError'));
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
      <div className="size-12 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <img
          data-testid="group-cover"
          src={group.coverUrl}
          alt=""
          className="size-full object-cover"
        />
      </div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger className="text-sm font-medium underline-offset-2 hover:underline">
          {t('cover.editButton')}
        </DialogTrigger>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{t('cover.editButton')}</DialogTitle>
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
              title={t('cover.cropTitle')}
              confirmLabel={t('cover.usePhoto')}
            />
          ) : (
            <>
              <div className="mt-6 flex items-center gap-3">
                <div className="size-12 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                  <img src={group.coverUrl} alt="" className="size-full object-cover" />
                </div>
                <span className="text-sm text-muted-foreground">{t('cover.currentCover')}</span>
              </div>

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
                  {t('cover.tabImage')}
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
                  {t('cover.tabEmoji')}
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
