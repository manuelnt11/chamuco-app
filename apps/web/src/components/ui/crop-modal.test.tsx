import { render, screen, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockOnConfirm: vi.fn(),
  mockOnCancel: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-image-crop', () => ({
  default: ({
    children,
    onChange,
    circularCrop,
  }: {
    children: ReactNode;
    onChange: (crop: { unit: string; x: number; y: number; width: number; height: number }) => void;
    circularCrop?: boolean;
  }) => (
    <div
      data-testid="react-crop"
      data-circular={circularCrop ? 'true' : 'false'}
      onClick={() => onChange({ unit: 'px', x: 10, y: 10, width: 100, height: 100 })}
    >
      {children}
    </div>
  ),
  centerCrop: vi.fn((crop: { unit: string; width: number }) => ({
    ...crop,
    x: 5,
    y: 5,
    height: crop.width,
  })),
  makeAspectCrop: vi.fn((crop: { unit: string; width: number }) => ({
    ...crop,
    height: crop.width,
  })),
}));

vi.mock('react-image-crop/dist/ReactCrop.css', () => ({}));

import type { ComponentProps } from 'react';
import { CropModal } from './crop-modal';

const testFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

const defaultProps: ComponentProps<typeof CropModal> = {
  file: testFile,
  onConfirm: mocks.mockOnConfirm,
  onCancel: mocks.mockOnCancel,
  isConfirming: false,
  uploadProgress: 0,
  isUploading: false,
  title: 'Crop your photo',
  confirmLabel: 'Use photo',
};

function setup(props?: Partial<ComponentProps<typeof CropModal>>) {
  const user = userEvent.setup();
  render(<CropModal {...defaultProps} {...props} />);
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({ drawImage: vi.fn() });
  HTMLCanvasElement.prototype.toBlob = vi
    .fn()
    .mockImplementation((cb: (blob: Blob | null) => void) =>
      cb(new Blob(['jpeg-data'], { type: 'image/jpeg' })),
    );
});

describe('CropModal', () => {
  describe('rendering', () => {
    it('shows the title prop', () => {
      setup();
      expect(screen.getByText('Crop your photo')).toBeInTheDocument();
    });

    it('shows the confirmLabel prop', () => {
      setup();
      expect(screen.getByText('Use photo')).toBeInTheDocument();
    });

    it('shows cancel button with actions.cancel key', () => {
      setup();
      expect(screen.getByText('actions.cancel')).toBeInTheDocument();
    });

    it('disables buttons when isConfirming is true', () => {
      setup({ isConfirming: true });
      expect(screen.getByText('actions.cancel')).toBeDisabled();
      expect(screen.getByText('Use photo')).toBeDisabled();
    });

    it('shows progress bar when isUploading is true', () => {
      setup({ isUploading: true, uploadProgress: 60 });
      const bar = screen.getByRole('progressbar');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveAttribute('aria-valuenow', '60');
    });

    it('hides progress bar when not uploading', () => {
      setup({ isUploading: false });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('passes circular=false to ReactCrop by default', () => {
      setup();
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-circular', 'false');
    });

    it('passes circular=true to ReactCrop when circular prop is set', () => {
      setup({ circular: true });
      expect(screen.getByTestId('react-crop')).toHaveAttribute('data-circular', 'true');
    });
  });

  describe('cancel', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByText('actions.cancel'));
      expect(mocks.mockOnCancel).toHaveBeenCalledOnce();
    });
  });

  describe('confirm', () => {
    it('calls onConfirm with a Blob after clicking confirm', async () => {
      const { user } = setup();

      const img = screen.getByRole('img');
      act(() => {
        Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
        Object.defineProperty(img, 'clientWidth', { value: 300, configurable: true });
        Object.defineProperty(img, 'clientHeight', { value: 300, configurable: true });
        img.dispatchEvent(new Event('load'));
      });

      await user.click(screen.getByText('Use photo'));

      expect(mocks.mockOnConfirm).toHaveBeenCalledOnce();
      expect(mocks.mockOnConfirm).toHaveBeenCalledWith(expect.any(Blob));
    });

    it('does not call onConfirm when toBlob returns null', async () => {
      HTMLCanvasElement.prototype.toBlob = vi
        .fn()
        .mockImplementation((cb: (blob: Blob | null) => void) => cb(null));

      const { user } = setup();

      const img = screen.getByRole('img');
      act(() => {
        Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
        img.dispatchEvent(new Event('load'));
      });

      await user.click(screen.getByText('Use photo'));

      expect(mocks.mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('object URL lifecycle', () => {
    it('creates object URL for the file', () => {
      setup();
      expect(URL.createObjectURL).toHaveBeenCalledWith(testFile);
    });

    it('revokes object URL on unmount', () => {
      const { unmount } = render(<CropModal {...defaultProps} />);
      unmount();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });
  });
});
