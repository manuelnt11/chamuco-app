import { render, screen, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  mockOnConfirm: vi.fn(),
  mockOnCancel: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key.replace(/^common:/, ''),
  }),
}));

vi.mock('react-image-crop', () => ({
  default: ({
    children,
    onChange,
  }: {
    children: ReactNode;
    onChange: (crop: { unit: string; x: number; y: number; width: number; height: number }) => void;
  }) => {
    return (
      <div
        data-testid="react-crop"
        onClick={() => onChange({ unit: 'px', x: 10, y: 10, width: 100, height: 100 })}
      >
        {children}
      </div>
    );
  },
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

import { GroupCoverCropModal } from './GroupCoverCropModal';

const testFile = new File(['test'], 'cover.jpg', { type: 'image/jpeg' });

const defaultProps = {
  file: testFile,
  onConfirm: mocks.mockOnConfirm,
  onCancel: mocks.mockOnCancel,
  isConfirming: false,
  uploadProgress: 0,
  isUploading: false,
};

function setup(props?: Partial<typeof defaultProps>) {
  const user = userEvent.setup();
  render(<GroupCoverCropModal {...defaultProps} {...props} />);
  return { user };
}

beforeEach(() => {
  vi.clearAllMocks();

  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    drawImage: vi.fn(),
  });
  HTMLCanvasElement.prototype.toBlob = vi
    .fn()
    .mockImplementation((cb: (blob: Blob | null) => void) =>
      cb(new Blob(['jpeg-data'], { type: 'image/jpeg' })),
    );
});

describe('GroupCoverCropModal', () => {
  describe('rendering', () => {
    it('shows crop title', () => {
      setup();
      expect(screen.getByText('cover.cropTitle')).toBeInTheDocument();
    });

    it('renders cancel and use photo buttons', () => {
      setup();
      expect(screen.getByText('actions.cancel')).toBeInTheDocument();
      expect(screen.getByText('cover.usePhoto')).toBeInTheDocument();
    });

    it('disables buttons when isConfirming is true', () => {
      setup({ isConfirming: true });
      expect(screen.getByText('actions.cancel')).toBeDisabled();
      expect(screen.getByText('cover.usePhoto')).toBeDisabled();
    });

    it('shows progress bar when isUploading is true', () => {
      setup({ isUploading: true, uploadProgress: 75 });
      const bar = screen.getByRole('progressbar');
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveAttribute('aria-valuenow', '75');
    });

    it('hides progress bar when not uploading', () => {
      setup({ isUploading: false, uploadProgress: 0 });
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
    it('calls onConfirm with a Blob after clicking use photo', async () => {
      const { user } = setup();

      const img = screen.getByRole('img');
      act(() => {
        Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
        Object.defineProperty(img, 'clientWidth', { value: 300, configurable: true });
        Object.defineProperty(img, 'clientHeight', { value: 300, configurable: true });
        img.dispatchEvent(new Event('load'));
      });

      await user.click(screen.getByText('cover.usePhoto'));

      expect(mocks.mockOnConfirm).toHaveBeenCalledOnce();
      expect(mocks.mockOnConfirm).toHaveBeenCalledWith(expect.any(Blob));
    });
  });

  describe('object URL lifecycle', () => {
    it('creates object URL for the file', () => {
      setup();
      expect(URL.createObjectURL).toHaveBeenCalledWith(testFile);
    });

    it('revokes object URL on unmount', () => {
      const { unmount } = render(<GroupCoverCropModal {...defaultProps} />);
      unmount();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
    });
  });

  describe('confirm — edge cases', () => {
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

      await user.click(screen.getByText('cover.usePhoto'));

      expect(mocks.mockOnConfirm).not.toHaveBeenCalled();
    });
  });
});
