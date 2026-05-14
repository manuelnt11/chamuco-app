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
    crop,
    circularCrop,
  }: {
    children: ReactNode;
    onChange: (crop: { unit: string; x: number; y: number; width: number; height: number }) => void;
    crop?: { unit: string; x: number; y: number; width: number; height: number };
    circularCrop?: boolean;
  }) => (
    <div
      data-testid="react-crop"
      data-circular={circularCrop ? 'true' : 'false'}
      data-crop-width={crop?.width}
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

    it('disables confirm button while toBlob is in progress', async () => {
      let resolveBlob!: (blob: Blob | null) => void;
      HTMLCanvasElement.prototype.toBlob = vi
        .fn()
        .mockImplementation((cb: (blob: Blob | null) => void) => {
          resolveBlob = cb;
        });

      const { user } = setup();

      const img = screen.getByRole('img');
      act(() => {
        Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
        img.dispatchEvent(new Event('load'));
      });

      await user.click(screen.getByText('Use photo'));
      expect(screen.getByText('Use photo')).toBeDisabled();

      act(() => resolveBlob(new Blob(['jpeg-data'], { type: 'image/jpeg' })));
      expect(screen.getByText('Use photo')).not.toBeDisabled();
    });

    it('prevents double-tap: only calls onConfirm once when clicked twice rapidly', async () => {
      let resolveBlob!: (blob: Blob | null) => void;
      HTMLCanvasElement.prototype.toBlob = vi
        .fn()
        .mockImplementation((cb: (blob: Blob | null) => void) => {
          resolveBlob = cb;
        });

      const { user } = setup();

      const img = screen.getByRole('img');
      act(() => {
        Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
        img.dispatchEvent(new Event('load'));
      });

      await user.click(screen.getByText('Use photo'));
      // Second click is ignored because button is disabled (isPending)
      await user.click(screen.getByText('Use photo'));

      act(() => resolveBlob(new Blob(['jpeg-data'], { type: 'image/jpeg' })));

      expect(mocks.mockOnConfirm).toHaveBeenCalledOnce();
    });
  });

  describe('pinch-to-zoom', () => {
    function makeTouchEvent(type: string, touches: { clientX: number; clientY: number }[]) {
      const event = new Event(type, { cancelable: true, bubbles: true });
      Object.defineProperty(event, 'touches', { value: touches });
      return event;
    }

    function loadImage() {
      const img = screen.getByRole('img');
      act(() => {
        Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
        img.dispatchEvent(new Event('load'));
      });
    }

    it('pinch-out expands the crop', () => {
      setup();
      loadImage();

      const container = screen.getByTestId('crop-container');
      const reactCrop = screen.getByTestId('react-crop');

      // Initial crop: makeAspectCrop called with { unit: '%', width: 90 } → mock returns width: 90
      expect(reactCrop).toHaveAttribute('data-crop-width', '90');

      act(() => {
        // Two fingers 100px apart
        container.dispatchEvent(
          makeTouchEvent('touchstart', [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 100 },
          ]),
        );
      });

      act(() => {
        // Two fingers 200px apart → scale = 2
        container.dispatchEvent(
          makeTouchEvent('touchmove', [
            { clientX: 50, clientY: 100 },
            { clientX: 250, clientY: 100 },
          ]),
        );
      });

      // maxScale = min(100/90, 100/90) ≈ 1.11 → clamped → newWidth = 90 * (100/90) = 100
      expect(reactCrop).toHaveAttribute('data-crop-width', '100');
    });

    it('pinch-in shrinks the crop', () => {
      setup();
      loadImage();

      const container = screen.getByTestId('crop-container');
      const reactCrop = screen.getByTestId('react-crop');

      act(() => {
        // Two fingers 200px apart
        container.dispatchEvent(
          makeTouchEvent('touchstart', [
            { clientX: 100, clientY: 100 },
            { clientX: 300, clientY: 100 },
          ]),
        );
      });

      act(() => {
        // Two fingers 100px apart → scale = 0.5
        container.dispatchEvent(
          makeTouchEvent('touchmove', [
            { clientX: 150, clientY: 100 },
            { clientX: 250, clientY: 100 },
          ]),
        );
      });

      // clampedScale = 0.5 → newWidth = 90 * 0.5 = 45
      expect(reactCrop).toHaveAttribute('data-crop-width', '45');
    });

    it('touchcancel clears pinch state — subsequent touchmove is ignored', () => {
      setup();
      loadImage();

      const container = screen.getByTestId('crop-container');
      const reactCrop = screen.getByTestId('react-crop');

      act(() => {
        container.dispatchEvent(
          makeTouchEvent('touchstart', [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 100 },
          ]),
        );
      });

      act(() => {
        // Cancel clears pinchRef
        container.dispatchEvent(makeTouchEvent('touchcancel', []));
      });

      act(() => {
        // This touchmove should be a no-op (pinchRef is null)
        container.dispatchEvent(
          makeTouchEvent('touchmove', [
            { clientX: 50, clientY: 100 },
            { clientX: 250, clientY: 100 },
          ]),
        );
      });

      // Crop unchanged from initial 90%
      expect(reactCrop).toHaveAttribute('data-crop-width', '90');
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
