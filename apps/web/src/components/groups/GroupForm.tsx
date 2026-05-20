'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { getTwemojiUrl } from '@chamuco/shared-utils';
import { GroupVisibility, UploadType } from '@chamuco/shared-types';

import axios from 'axios';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { apiClient } from '@/services/api-client';
import { uploadToGcs } from '@/services/gcs-upload';
import { AVATAR_EMOJIS } from '@/lib/avatar-emojis';
import type { Group } from '@/types/group';
import { CropModal } from '@/components/ui/crop-modal';

type CoverTab = 'emoji' | 'photo';

interface SignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
}

interface GroupFormProps {
  mode: 'create' | 'edit';
  groupId?: string;
  initialValues?: {
    name: string;
    description: string | null;
    visibility: GroupVisibility;
  };
  hasNonOwnerMembers?: boolean;
  onSuccess: (group: Group) => void;
}

export function GroupForm({
  mode,
  groupId,
  initialValues,
  hasNonOwnerMembers,
  onSuccess,
}: GroupFormProps) {
  const { t } = useTranslation(['groups', 'common']);

  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [visibility, setVisibility] = useState<GroupVisibility>(
    initialValues?.visibility ?? GroupVisibility.PUBLIC,
  );
  const [coverTab, setCoverTab] = useState<CoverTab>('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState(AVATAR_EMOJIS[0] ?? '😀');
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrivateConfirm, setShowPrivateConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPublicDisabled =
    mode === 'edit' &&
    hasNonOwnerMembers === true &&
    initialValues?.visibility === GroupVisibility.PRIVATE;

  useEffect(() => {
    if (!croppedBlob) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(croppedBlob);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [croppedBlob]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCropFile(file);
  }

  async function doSubmit() {
    setIsSaving(true);
    try {
      if (mode === 'create') {
        const res = await apiClient.post<Group>('/v1/groups', {
          name,
          description: description.trim() || undefined,
          visibility,
          cover: { source: 'emoji', target: selectedEmoji },
        });
        let group = res.data;

        if (coverTab === 'photo' && croppedBlob) {
          const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });
          const { data: signed } = await apiClient.post<SignedUrlResponse>(
            '/v1/uploads/signed-url',
            {
              uploadType: UploadType.GROUP_COVER,
              contextId: group.id,
              contentType: 'image/jpeg',
              fileSize: croppedBlob.size,
            },
          );
          await uploadToGcs(signed.uploadUrl, file, () => {});
          const patchRes = await apiClient.patch<Group>(`/v1/groups/${group.id}`, {
            cover: { source: 'gcs', target: signed.objectKey, fileSize: croppedBlob.size },
          });
          group = patchRes.data;
        }

        onSuccess(group);
      } else {
        const res = await apiClient.patch<Group>(`/v1/groups/${groupId}`, {
          name,
          description: description.trim() || undefined,
          visibility,
        });
        setShowPrivateConfirm(false);
        onSuccess(res.data);
      }
    } catch (err) {
      const isCannotMakePublic =
        axios.isAxiosError(err) &&
        err.response?.status === 400 &&
        (err.response.data as { error?: string }).error === 'GROUP_CANNOT_BE_MADE_PUBLIC';
      const isForbidden = axios.isAxiosError(err) && err.response?.status === 403;
      if (isCannotMakePublic) {
        toast.error(t('errors.cannotMakePublic'));
      } else if (isForbidden) {
        toast.error(t('errors.forbidden'));
      } else {
        toast.error(mode === 'create' ? t('errors.createFailed') : t('errors.saveFailed'));
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit() {
    const isPublicToPrivate =
      mode === 'edit' &&
      initialValues?.visibility === GroupVisibility.PUBLIC &&
      visibility === GroupVisibility.PRIVATE;

    if (isPublicToPrivate) {
      setShowPrivateConfirm(true);
      return;
    }

    void doSubmit();
  }

  const submitDisabled =
    isSaving ||
    name.trim().length < 2 ||
    (mode === 'create' && coverTab === 'photo' && !croppedBlob);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-6"
      >
        <div className="space-y-1.5">
          <Label htmlFor="group-name">{t('name')}</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            required
            minLength={2}
            maxLength={100}
            disabled={isSaving}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="group-description">{t('description')}</Label>
          <Textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('descriptionPlaceholder')}
            maxLength={500}
            disabled={isSaving}
            rows={3}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('visibility.label')}</legend>
          {[GroupVisibility.PUBLIC, GroupVisibility.PRIVATE].map((v) => {
            const isDisabled = isSaving || (v === GroupVisibility.PUBLIC && isPublicDisabled);
            return (
              <label
                key={v}
                title={
                  v === GroupVisibility.PUBLIC && isPublicDisabled
                    ? t('visibility.public_disabled_tooltip')
                    : undefined
                }
                className={`flex items-start gap-3 rounded-lg border border-border p-3 has-checked:border-primary has-checked:bg-primary/5 ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={visibility === v}
                  onChange={() => setVisibility(v)}
                  disabled={isDisabled}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">
                    {v === GroupVisibility.PUBLIC
                      ? t('visibility.public')
                      : t('visibility.private')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v === GroupVisibility.PUBLIC
                      ? t('visibility.public_desc')
                      : t('visibility.private_desc')}
                  </p>
                  {v === GroupVisibility.PRIVATE && visibility === GroupVisibility.PRIVATE && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {t('visibility.private_irreversible_hint')}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </fieldset>

        {mode === 'create' && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('cover.label')}</p>

            {cropFile ? (
              <CropModal
                file={cropFile}
                onConfirm={(blob) => {
                  setCroppedBlob(blob);
                  setCropFile(null);
                }}
                onCancel={() => setCropFile(null)}
                isConfirming={false}
                uploadProgress={0}
                isUploading={false}
                title={t('cover.cropTitle')}
                confirmLabel={t('cover.usePhoto')}
              />
            ) : (
              <>
                <div className="flex gap-2 border-b">
                  {(['photo', 'emoji'] as CoverTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setCoverTab(tab)}
                      className={`pb-2 text-sm font-medium transition-colors ${
                        coverTab === tab
                          ? 'border-b-2 border-primary text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'photo' ? t('cover.tabImage') : t('cover.tabEmoji')}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  {coverTab === 'photo' && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                        aria-hidden="true"
                      />
                      {photoPreviewUrl ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={photoPreviewUrl}
                            alt=""
                            className="size-12 rounded-lg object-cover"
                            aria-hidden="true"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSaving}
                            className="text-sm font-medium underline-offset-2 hover:underline disabled:opacity-50"
                          >
                            {t('cover.editButton')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSaving}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                        >
                          {t('common:upload.chooseFile')}
                        </button>
                      )}
                    </>
                  )}

                  {coverTab === 'emoji' && (
                    <div className="grid grid-cols-8 gap-2">
                      {AVATAR_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedEmoji(emoji)}
                          disabled={isSaving}
                          aria-label={emoji}
                          aria-pressed={selectedEmoji === emoji}
                          className={`flex size-10 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                            selectedEmoji === emoji
                              ? 'bg-primary/10 ring-2 ring-primary'
                              : 'hover:bg-muted'
                          }`}
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
          </div>
        )}

        <button
          type="submit"
          disabled={submitDisabled}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving
            ? t('form.saving')
            : mode === 'create'
              ? t('form.submit')
              : t('form.saveChanges')}
        </button>
      </form>

      {showPrivateConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="private-confirm-title"
          data-testid="confirm-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="mx-4 w-full max-w-sm rounded-xl bg-card p-6 shadow-xl ring-1 ring-foreground/10">
            <h2 id="private-confirm-title" className="text-lg font-semibold">
              {t('visibility.makePrivateConfirmTitle')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('visibility.makePrivateWarning')}
            </p>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowPrivateConfirm(false)}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                {t('common:actions.cancel')}
              </button>
              <button
                type="button"
                data-testid="confirm-make-private"
                onClick={doSubmit}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t('visibility.makePrivateConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
