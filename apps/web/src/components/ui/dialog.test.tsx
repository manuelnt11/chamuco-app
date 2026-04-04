import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog';

function TestDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogPopup>
        <DialogClose />
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Dialog description</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Cancel</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('renders trigger button', () => {
    render(<TestDialog />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('dialog is not visible initially', () => {
    render(<TestDialog />);
    expect(screen.queryByText('Dialog title')).not.toBeInTheDocument();
  });

  it('opens dialog on trigger click', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);
    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Dialog title')).toBeInTheDocument();
  });

  it('shows title and description when open', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);
    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Dialog title')).toBeInTheDocument();
    expect(screen.getByText('Dialog description')).toBeInTheDocument();
  });

  it('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<TestDialog />);
    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Dialog title')).toBeInTheDocument();
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Dialog title')).not.toBeInTheDocument();
  });

  it('renders with defaultOpen=true', () => {
    render(<TestDialog defaultOpen />);
    expect(screen.getByText('Dialog title')).toBeInTheDocument();
  });

  describe('DialogHeader', () => {
    it('renders children', () => {
      const { container } = render(<DialogHeader>Header content</DialogHeader>);
      expect(container).toHaveTextContent('Header content');
    });

    it('has data-slot attribute', () => {
      const { container } = render(<DialogHeader />);
      expect(container.querySelector('[data-slot="dialog-header"]')).toBeInTheDocument();
    });
  });

  describe('DialogFooter', () => {
    it('renders children', () => {
      const { container } = render(<DialogFooter>Footer content</DialogFooter>);
      expect(container).toHaveTextContent('Footer content');
    });

    it('has data-slot attribute', () => {
      const { container } = render(<DialogFooter />);
      expect(container.querySelector('[data-slot="dialog-footer"]')).toBeInTheDocument();
    });
  });
});
