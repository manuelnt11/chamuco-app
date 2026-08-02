import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TripTaskScope } from '@chamuco/shared-types';
import { TripTaskItem } from './trip-task-item';
import type { TripTask } from '@/services/trips.types';

vi.mock('@/components/ui/edit-delete-actions', () => ({
  EditDeleteActions: ({
    onEdit,
    onDelete,
    disabled,
  }: {
    onEdit?: () => void;
    onDelete?: () => Promise<void>;
    disabled?: boolean;
  }) => (
    <div data-testid="edit-delete-actions" aria-disabled={disabled}>
      {onEdit && (
        <button type="button" onClick={onEdit} data-testid="edit-btn">
          edit
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={() => void onDelete()} data-testid="delete-btn">
          delete
        </button>
      )}
    </div>
  ),
}));

const task: TripTask = {
  id: 'task-1',
  tripId: 'trip-1',
  scope: TripTaskScope.PERSONAL,
  title: 'Pack sunscreen',
  completed: false,
  ownerId: 'user-1',
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TripTaskItem', () => {
  it('renders the task title', () => {
    render(<TripTaskItem task={task} onToggle={vi.fn()} />);
    expect(screen.getByText('Pack sunscreen')).toBeInTheDocument();
  });

  it('applies strike-through styling when completed', () => {
    render(<TripTaskItem task={{ ...task, completed: true }} onToggle={vi.fn()} />);
    expect(screen.getByText('Pack sunscreen').className).toContain('line-through');
  });

  it('does not apply strike-through styling when not completed', () => {
    render(<TripTaskItem task={task} onToggle={vi.fn()} />);
    expect(screen.getByText('Pack sunscreen').className).not.toContain('line-through');
  });

  it('calls onToggle with the inverted completion state when checkbox is clicked', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined);
    render(<TripTaskItem task={task} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(onToggle).toHaveBeenCalledWith(true));
  });

  it('does not render delete action when onDelete is omitted', () => {
    render(<TripTaskItem task={task} onToggle={vi.fn()} />);
    expect(screen.queryByTestId('edit-delete-actions')).not.toBeInTheDocument();
  });

  it('renders delete action when onDelete is provided', () => {
    render(<TripTaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<TripTaskItem task={task} onToggle={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('delete-btn'));
    await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
  });

  describe('rename', () => {
    it('does not render edit action when onRename is omitted', () => {
      render(<TripTaskItem task={task} onToggle={vi.fn()} />);
      expect(screen.queryByTestId('edit-delete-actions')).not.toBeInTheDocument();
    });

    it('renders edit action when onRename is provided', () => {
      render(<TripTaskItem task={task} onToggle={vi.fn()} onRename={vi.fn()} />);
      expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
    });

    it('enters edit mode showing an input pre-filled with the current title', () => {
      render(<TripTaskItem task={task} onToggle={vi.fn()} onRename={vi.fn()} />);
      fireEvent.click(screen.getByTestId('edit-btn'));
      expect(screen.getByDisplayValue('Pack sunscreen')).toBeInTheDocument();
    });

    it('calls onRename with the trimmed title when saved', async () => {
      const onRename = vi.fn().mockResolvedValue(undefined);
      render(<TripTaskItem task={task} onToggle={vi.fn()} onRename={onRename} />);
      fireEvent.click(screen.getByTestId('edit-btn'));
      fireEvent.change(screen.getByDisplayValue('Pack sunscreen'), {
        target: { value: '  Pack reef-safe sunscreen  ' },
      });
      fireEvent.click(screen.getByText('actions.save'));
      await waitFor(() => expect(onRename).toHaveBeenCalledWith('Pack reef-safe sunscreen'));
    });

    it('exits edit mode without calling onRename when cancelled', () => {
      const onRename = vi.fn();
      render(<TripTaskItem task={task} onToggle={vi.fn()} onRename={onRename} />);
      fireEvent.click(screen.getByTestId('edit-btn'));
      fireEvent.change(screen.getByDisplayValue('Pack sunscreen'), {
        target: { value: 'Something else' },
      });
      fireEvent.click(screen.getByText('actions.cancel'));

      expect(onRename).not.toHaveBeenCalled();
      expect(screen.getByText('Pack sunscreen')).toBeInTheDocument();
    });

    it('exits edit mode without calling onRename when saved with an unchanged title', async () => {
      const onRename = vi.fn();
      render(<TripTaskItem task={task} onToggle={vi.fn()} onRename={onRename} />);
      fireEvent.click(screen.getByTestId('edit-btn'));
      fireEvent.click(screen.getByText('actions.save'));

      await waitFor(() => expect(screen.getByText('Pack sunscreen')).toBeInTheDocument());
      expect(onRename).not.toHaveBeenCalled();
    });
  });
});
