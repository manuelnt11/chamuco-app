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

import { AvatarCropModal } from './AvatarCropModal';

const testFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });

const defaultProps = {
  file: testFile,
  onConfirm: mocks.mockOnConfirm,
  onCancel: mocks.mockOnCancel,
  isConfirming: false,
};

function setup(props?: Partial<typeof defaultProps>) {
  const user = userEvent.setup();
  render(<AvatarCropModal {...defaultProps} {...props} />);
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

describe('AvatarCropModal', () => {
  describe('rendering', () => {
    it('shows crop editor title', () => {
      setup();
      expect(screen.getByText('basicInfo.avatarEditor.cropEditor.title')).toBeInTheDocument();
    });

    it('renders cancel and use photo buttons', () => {
      setup();
      expect(screen.getByText('basicInfo.avatarEditor.cropEditor.cancel')).toBeInTheDocument();
      expect(screen.getByText('basicInfo.avatarEditor.cropEditor.usePhoto')).toBeInTheDocument();
    });

    it('disables buttons when isConfirming is true', () => {
      setup({ isConfirming: true });
      expect(screen.getByText('basicInfo.avatarEditor.cropEditor.cancel')).toBeDisabled();
      expect(screen.getByText('basicInfo.avatarEditor.cropEditor.usePhoto')).toBeDisabled();
    });
  });

  describe('cancel', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const { user } = setup();
      await user.click(screen.getByText('basicInfo.avatarEditor.cropEditor.cancel'));
      expect(mocks.mockOnCancel).toHaveBeenCalledOnce();
    });
  });

  describe('confirm', () => {
    it('calls onConfirm with a Blob after clicking use photo', async () => {
      const { user } = setup();

      // Simulate image load to set completedCrop
      const img = screen.getByRole('img');
      act(() => {
        Object.defineProperty(img, 'naturalWidth', { value: 400, configurable: true });
        Object.defineProperty(img, 'naturalHeight', { value: 400, configurable: true });
        Object.defineProperty(img, 'clientWidth', { value: 300, configurable: true });
        Object.defineProperty(img, 'clientHeight', { value: 300, configurable: true });
        img.dispatchEvent(new Event('load'));
      });

      await user.click(screen.getByText('basicInfo.avatarEditor.cropEditor.usePhoto'));

      expect(mocks.mockOnConfirm).toHaveBeenCalledOnce();
      expect(mocks.mockOnConfirm).toHaveBeenCalledWith(expect.any(Blob));
    });
  });

  describe('object URL lifecycle', () => {
    it('creates object URL for the file', () => {
      setup();
      expect(URL.createObjectURL).toHaveBeenCalledWith(testFile);
    });
  });
});
