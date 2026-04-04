import * as React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { ToastProvider, toast, toastManager } from './toast';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderWithProvider(ui: React.ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

// toastManager is a module-level singleton shared across tests.
// Call toast.dismiss() before cleanup() so the Provider processes the close
// while it is still mounted, preventing state leakage between tests.
afterEach(() => {
  act(() => {
    toast.dismiss();
  });
  cleanup();
});

describe('ToastProvider', () => {
  it('renders children', () => {
    renderWithProvider(<div>App content</div>);
    expect(screen.getByText('App content')).toBeInTheDocument();
  });
});

describe('toast manager', () => {
  it('shows a toast with title', () => {
    renderWithProvider(<></>);

    act(() => {
      toast.show({ title: 'Hello!' });
    });

    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('shows a toast with title and description', () => {
    renderWithProvider(<></>);

    act(() => {
      toast.show({ title: 'Saved', description: 'Your changes were saved.' });
    });

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes were saved.')).toBeInTheDocument();
  });

  it('toast.success shows a success toast', () => {
    renderWithProvider(<></>);

    act(() => {
      toast.success('Trip created');
    });

    expect(screen.getByText('Trip created')).toBeInTheDocument();
  });

  it('toast.error shows an error toast', () => {
    renderWithProvider(<></>);

    act(() => {
      toast.error('Something went wrong');
    });

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('toast.warning shows a warning toast', () => {
    renderWithProvider(<></>);

    act(() => {
      toast.warning('Check your input');
    });

    expect(screen.getByText('Check your input')).toBeInTheDocument();
  });

  it('toast.info shows an info toast', () => {
    renderWithProvider(<></>);

    act(() => {
      toast.info('New feature available');
    });

    expect(screen.getByText('New feature available')).toBeInTheDocument();
  });

  it('dismiss button removes the toast', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProvider(<></>);

    act(() => {
      toast.show({ title: 'Dismiss me', timeout: 0 });
    });

    expect(screen.getByText('Dismiss me')).toBeInTheDocument();
    // Find the close button directly — aria-label comes from t('actions.close')
    const dismissBtn = container.querySelector('button[aria-label="actions.close"]');
    expect(dismissBtn).toBeInTheDocument();
    await user.click(dismissBtn!);
    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  it('toast.dismiss closes toast by id', () => {
    renderWithProvider(<></>);

    let id!: string;
    act(() => {
      id = toast.show({ title: 'Close me', timeout: 0 });
    });

    expect(screen.getByText('Close me')).toBeInTheDocument();

    act(() => {
      toast.dismiss(id);
    });

    expect(screen.queryByText('Close me')).not.toBeInTheDocument();
  });

  it('toastManager is exported', () => {
    expect(toastManager).toBeDefined();
    expect(typeof toastManager.add).toBe('function');
    expect(typeof toastManager.close).toBe('function');
  });
});
