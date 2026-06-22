import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  ),
}));

import { AnnouncementForm } from './announcement-form';

describe('AnnouncementForm', () => {
  const baseProps = {
    value: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    submitLabel: 'Publish',
    placeholder: 'Write something...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the editor and submit button', () => {
    render(<AnnouncementForm {...baseProps} />);
    expect(screen.getByPlaceholderText('Write something...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  it('submit button is disabled when value is empty', () => {
    render(<AnnouncementForm {...baseProps} value="" />);
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
  });

  it('submit button is enabled when value has content', () => {
    render(<AnnouncementForm {...baseProps} value="Hello members!" />);
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });

  it('submit button is disabled when isSubmitting', () => {
    render(<AnnouncementForm {...baseProps} value="content" isSubmitting />);
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
  });

  it('shows error message when provided', () => {
    render(<AnnouncementForm {...baseProps} errorMessage="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not render error when errorMessage is undefined', () => {
    render(<AnnouncementForm {...baseProps} />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('calls onChange when editor value changes', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm {...baseProps} />);
    await user.type(screen.getByPlaceholderText('Write something...'), 'Hi');
    expect(baseProps.onChange).toHaveBeenCalled();
  });

  it('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    render(<AnnouncementForm {...baseProps} value="content" />);
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    expect(baseProps.onSubmit).toHaveBeenCalled();
  });
});
