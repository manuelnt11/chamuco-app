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

  const [sharedTitle, setSharedTitle] = useState('');
  const [personalTitle, setPersonalTitle] = useState('');
  const [isSubmittingShared, setIsSubmittingShared] = useState(false);
  const [isSubmittingPersonal, setIsSubmittingPersonal] = useState(false);

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

  const handleCreateTask = async (
    scope: TripTaskScope,
    taskTitle: string,
    resetTitle: () => void,
    setSubmitting: (value: boolean) => void,
  ) => {
    if (!taskTitle.trim()) return;

    setSubmitting(true);
    setMutateError(null);
    try {
      const created = await createTripTask(id, { scope, title: taskTitle.trim() });
      setTasks((prev) => [...prev, created]);
      resetTitle();
    } catch {
      setMutateError(t('tasks.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitShared = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleCreateTask(
      TripTaskScope.SHARED,
      sharedTitle,
      () => setSharedTitle(''),
      setIsSubmittingShared,
    );
  };

  const handleSubmitPersonal = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleCreateTask(
      TripTaskScope.PERSONAL,
      personalTitle,
      () => setPersonalTitle(''),
      setIsSubmittingPersonal,
    );
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
        {isOrganizer && (
          <form onSubmit={handleSubmitShared} className="mt-3 flex items-center gap-2">
            <Input
              value={sharedTitle}
              onChange={(e) => setSharedTitle(e.target.value)}
              placeholder={t('tasks.addPlaceholderShared')}
              maxLength={200}
              disabled={isSubmittingShared}
            />
            <button
              type="submit"
              disabled={isSubmittingShared || !sharedTitle.trim()}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('tasks.addButtonShared')}
              aria-label={t('tasks.addButtonShared')}
            >
              <PlusIcon className="size-5" aria-hidden="true" />
            </button>
          </form>
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
        <form onSubmit={handleSubmitPersonal} className="mt-3 flex items-center gap-2">
          <Input
            value={personalTitle}
            onChange={(e) => setPersonalTitle(e.target.value)}
            placeholder={t('tasks.addPlaceholderPersonal')}
            maxLength={200}
            disabled={isSubmittingPersonal}
          />
          <button
            type="submit"
            disabled={isSubmittingPersonal || !personalTitle.trim()}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('tasks.addButtonPersonal')}
            aria-label={t('tasks.addButtonPersonal')}
          >
            <PlusIcon className="size-5" aria-hidden="true" />
          </button>
        </form>
      </section>
    </div>
  );
}
