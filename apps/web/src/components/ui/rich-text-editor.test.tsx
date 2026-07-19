import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RichTextEditor } from './rich-text-editor';

const mockRun = vi.fn();
const mockInsertContent = vi.fn(() => ({ run: mockRun }));
const mockToggle = vi.fn(() => ({ run: mockRun }));
const mockInsertTable = vi.fn(() => ({ run: mockRun }));
const mockFocus = vi.fn(() => ({
  toggleHeading: mockToggle,
  toggleBold: mockToggle,
  toggleItalic: mockToggle,
  toggleBulletList: mockToggle,
  toggleOrderedList: mockToggle,
  toggleBlockquote: mockToggle,
  toggleCode: mockToggle,
  insertContent: mockInsertContent,
  insertTable: mockInsertTable,
}));
const mockChain = vi.fn(() => ({ focus: mockFocus }));
const mockIsActive = vi.fn(() => false);
const mockGetMarkdown = vi.fn(() => '');

const mockEditor = {
  isActive: mockIsActive,
  chain: mockChain,
  storage: {
    characterCount: { characters: vi.fn(() => 0) },
    markdown: { getMarkdown: mockGetMarkdown },
  },
  destroy: vi.fn(),
};

type UseEditorOpts = { onUpdate?: (args: { editor: typeof mockEditor }) => void };
type UseEditorMock = Mock & { lastOpts?: UseEditorOpts };

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn((opts: UseEditorOpts) => {
    (useEditorMock as UseEditorMock).lastOpts = opts;
    return mockEditor;
  }),
  EditorContent: ({ editor: _editor }: { editor: unknown }) => (
    <div data-testid="editor-content" role="textbox" aria-multiline="true" />
  ),
}));

import { useEditor as useEditorMock } from '@tiptap/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

vi.mock('@emoji-mart/react', () => ({
  default: ({ onEmojiSelect }: { onEmojiSelect: (e: { native: string }) => void }) => (
    <button data-testid="emoji-picker" onClick={() => onEmojiSelect({ native: '😀' })} />
  ),
}));

vi.mock('@emoji-mart/data', () => ({ default: {} }));

vi.mock('@tiptap/starter-kit', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-placeholder', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-character-count', () => ({
  default: { configure: vi.fn(() => ({})) },
}));
vi.mock('tiptap-markdown', () => ({
  Markdown: { configure: vi.fn(() => ({})) },
}));
vi.mock('@tiptap/extension-table', () => ({ Table: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-table-row', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-header', () => ({ default: {} }));
vi.mock('@tiptap/extension-table-cell', () => ({ default: {} }));

describe('RichTextEditor', () => {
  it('renders without crashing', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  it('renders all toolbar buttons', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    expect(screen.getByTitle('editor.heading1')).toBeInTheDocument();
    expect(screen.getByTitle('editor.heading2')).toBeInTheDocument();
    expect(screen.getByTitle('editor.heading3')).toBeInTheDocument();
    expect(screen.getByTitle('editor.bold')).toBeInTheDocument();
    expect(screen.getByTitle('editor.italic')).toBeInTheDocument();
    expect(screen.getByTitle('editor.bulletList')).toBeInTheDocument();
    expect(screen.getByTitle('editor.orderedList')).toBeInTheDocument();
    expect(screen.getByTitle('editor.blockquote')).toBeInTheDocument();
    expect(screen.getByTitle('editor.code')).toBeInTheDocument();
    expect(screen.getByTitle('editor.table')).toBeInTheDocument();
    expect(screen.getByTitle('editor.emoji')).toBeInTheDocument();
  });

  it('shows character count with default maxLength', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    expect(screen.getByText('0/2000')).toBeInTheDocument();
  });

  it('shows character count with custom maxLength', () => {
    render(<RichTextEditor value="" onChange={() => {}} maxLength={500} />);
    expect(screen.getByText('0/500')).toBeInTheDocument();
  });

  it('marks character count as destructive when at limit', () => {
    mockEditor.storage.characterCount.characters = vi.fn(() => 2000);
    render(<RichTextEditor value="" onChange={() => {}} maxLength={2000} />);
    const counter = screen.getByText('2000/2000');
    expect(counter.className).toContain('text-destructive');
    mockEditor.storage.characterCount.characters = vi.fn(() => 0);
  });

  it('disables all toolbar buttons when disabled prop is true', () => {
    render(<RichTextEditor value="" onChange={() => {}} disabled />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('calls onChange with markdown output on update', () => {
    const handleChange = vi.fn();
    render(<RichTextEditor value="" onChange={handleChange} />);

    mockGetMarkdown.mockReturnValueOnce('**hello**');
    const opts = (useEditorMock as UseEditorMock).lastOpts as {
      onUpdate?: (args: { editor: typeof mockEditor }) => void;
    };
    opts.onUpdate?.({ editor: mockEditor });

    expect(handleChange).toHaveBeenCalledWith('**hello**');
  });

  it('calls toggleBold chain on bold button click', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    fireEvent.click(screen.getByTitle('editor.bold'));
    expect(mockChain).toHaveBeenCalled();
  });

  it('opens emoji picker on emoji button click', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('editor.emoji'));
    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
  });

  it('opens table size picker on table button click', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    expect(screen.queryByTestId('table-size-picker')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle('editor.table'));
    expect(screen.getByTestId('table-size-picker')).toBeInTheDocument();
  });

  it('inserts table with hovered dimensions on cell click', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    fireEvent.click(screen.getByTitle('editor.table'));
    const cell = screen.getByTestId('table-cell-3-4');
    fireEvent.mouseEnter(cell);
    fireEvent.click(cell);
    expect(mockInsertTable).toHaveBeenCalledWith({ rows: 3, cols: 4, withHeaderRow: true });
  });

  it('closes table picker after table insertion', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    fireEvent.click(screen.getByTitle('editor.table'));
    const cell = screen.getByTestId('table-cell-2-2');
    fireEvent.mouseEnter(cell);
    fireEvent.click(cell);
    expect(screen.queryByTestId('table-size-picker')).not.toBeInTheDocument();
  });

  it('closes emoji picker after emoji selection and inserts content', () => {
    render(<RichTextEditor value="" onChange={() => {}} />);
    fireEvent.click(screen.getByTitle('editor.emoji'));
    fireEvent.click(screen.getByTestId('emoji-picker'));
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument();
    expect(mockInsertContent).toHaveBeenCalledWith('😀');
  });
});
