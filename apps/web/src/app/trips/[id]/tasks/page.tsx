'use client';

import { useEffect, useState, use, type SubmitEvent } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ORGANIZER_ROLES, TripRole, TripTaskScope } from '@chamuco/shared-types';
import {
  ArrowLeftIcon,
  ListChecksIcon,
  PlusIcon,
  UserIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';

import {
  createTripTask,
  deleteTripTask,
  getTrip,
  getTripParticipation,
  getTripTasks,
  setTripTaskCompletion,
  updateTripTaskTitle,
} from '@/services/trips.service';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { TripTaskItem } from '@/components/ui/trip-task-item';
import type { TripResponse, TripTask } from '@/services/trips.types';

interface TripTasksPageProps {
  params: Promise<{ id: string }>;
}

export default function TripTasksPage({ params }: TripTasksPageProps) {
  const { id } = use(params);
  const { t } = useTranslation('trips');
  const { isLoading: isAuthLoading } = useAuth();

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [tasks, setTasks] = useState<TripTask[]>([]);
  const [callerRole, setCallerRole] = useState<TripRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<TripTaskScope>(TripTaskScope.PERSONAL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOrganizer = callerRole !== null && ORGANIZER_ROLES.includes(callerRole);

  useEffect(() => {
    if (isAuthLoading) return;

    const load = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const [tripData, participation, tasksData] = await Promise.all([
          getTrip(id),
          getTripParticipation(id).catch(() => null),
          getTripTasks(id).catch(() => []),
        ]);

        setTrip(tripData);
        setCallerRole(participation?.role ?? null);
        setTasks(tasksData);
      } catch {
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, isAuthLoading]);

  const handleToggle = async (taskId: string, completed: boolean) => {
    setMutateError(null);
    try {
      const updated = await setTripTaskCompletion(id, taskId, { completed });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch {
      setMutateError(t('tasks.toggleError'));
    }
  };

  const handleRename = async (taskId: string, newTitle: string) => {
    setMutateError(null);
    try {
      const updated = await updateTripTaskTitle(id, taskId, { title: newTitle });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch {
      setMutateError(t('tasks.renameError'));
    }
  };

  const handleDelete = async (taskId: string) => {
    setMutateError(null);
    try {
      await deleteTripTask(id, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      setMutateError(t('tasks.deleteError'));
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setMutateError(null);
    try {
      const created = await createTripTask(id, { scope, title: title.trim() });
      setTasks((prev) => [...prev, created]);
      setTitle('');
    } catch {
      setMutateError(t('tasks.createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  if (loadError || !trip) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">{t('tasks.loadError')}</p>
      </div>
    );
  }

  const sharedTasks = tasks.filter((task) => task.scope === TripTaskScope.SHARED);
  const personalTasks = tasks.filter((task) => task.scope === TripTaskScope.PERSONAL);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/trips/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {trip.name}
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <ListChecksIcon className="size-5" aria-hidden="true" />
        <h1 className="text-2xl font-bold">{t('tasks.title')}</h1>
      </div>

      {mutateError && <p className="mb-4 text-sm text-destructive">{mutateError}</p>}

      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <UsersThreeIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold">
            {t('tasks.sharedTitle', {
              completed: sharedTasks.filter((task) => task.completed).length,
              total: sharedTasks.length,
            })}
          </h2>
        </div>
        {sharedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('tasks.sharedEmpty')}</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {sharedTasks.map((task) => (
              <TripTaskItem
                key={task.id}
                task={task}
                onToggle={(completed) => handleToggle(task.id, completed)}
                onRename={isOrganizer ? (newTitle) => handleRename(task.id, newTitle) : undefined}
                onDelete={isOrganizer ? () => handleDelete(task.id) : undefined}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <UserIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold">
            {t('tasks.personalTitle', {
              completed: personalTasks.filter((task) => task.completed).length,
              total: personalTasks.length,
            })}
          </h2>
        </div>
        {personalTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('tasks.personalEmpty')}</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {personalTasks.map((task) => (
              <TripTaskItem
                key={task.id}
                task={task}
                onToggle={(completed) => handleToggle(task.id, completed)}
                onRename={(newTitle) => handleRename(task.id, newTitle)}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('tasks.addPlaceholder')}
          maxLength={200}
          disabled={isSubmitting}
        />
        {isOrganizer && (
          <button
            type="button"
            onClick={() =>
              setScope((prev) =>
                prev === TripTaskScope.PERSONAL ? TripTaskScope.SHARED : TripTaskScope.PERSONAL,
              )
            }
            disabled={isSubmitting}
            aria-pressed={scope === TripTaskScope.SHARED}
            className={`inline-flex shrink-0 items-center justify-center rounded-lg border p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed${
              scope === TripTaskScope.SHARED
                ? ' border-primary bg-primary text-primary-foreground'
                : ' border-border bg-background hover:bg-muted'
            }`}
            title={t(`tasks.scope.${scope}`)}
            aria-label={t(`tasks.scope.${scope}`)}
          >
            {scope === TripTaskScope.SHARED ? (
              <UsersThreeIcon className="size-5" aria-hidden="true" />
            ) : (
              <UserIcon className="size-5" aria-hidden="true" />
            )}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('tasks.addButton')}
          aria-label={t('tasks.addButton')}
        >
          <PlusIcon className="size-5" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
