import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/ui/button', () => ({
  Button: (props: React.ComponentProps<'button'>) => <button {...props} />,
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <span data-testid="spinner" />,
}));

import { SaveButton } from './save-button';

describe('SaveButton', () => {
  it('renders with the provided label', () => {
    render(<SaveButton label="Save" isSaving={false} isDirty={true} />);
    expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument();
  });

  it('is disabled when not dirty', () => {
    render(<SaveButton label="Save" isSaving={false} isDirty={false} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when saving', () => {
    render(<SaveButton label="Save" isSaving={true} isDirty={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is enabled when dirty and not saving', () => {
    render(<SaveButton label="Save" isSaving={false} isDirty={true} />);
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('shows spinner when saving', () => {
    render(<SaveButton label="Save" isSaving={true} isDirty={true} />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('hides spinner when not saving', () => {
    render(<SaveButton label="Save" isSaving={false} isDirty={true} />);
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('shows unsaved-indicator when dirty and not saving', () => {
    render(<SaveButton label="Save" isSaving={false} isDirty={true} />);
    expect(screen.getByTestId('unsaved-indicator')).toBeInTheDocument();
  });

  it('hides unsaved-indicator when not dirty', () => {
    render(<SaveButton label="Save" isSaving={false} isDirty={false} />);
    expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
  });

  it('hides unsaved-indicator when saving', () => {
    render(<SaveButton label="Save" isSaving={true} isDirty={true} />);
    expect(screen.queryByTestId('unsaved-indicator')).not.toBeInTheDocument();
  });

  it('renders as a submit button', () => {
    render(<SaveButton label="Save" isSaving={false} isDirty={true} />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
