'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Markdown } from 'tiptap-markdown';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import {
  TextBIcon,
  TextItalicIcon,
  TextHOneIcon,
  TextHTwoIcon,
  TextHThreeIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  QuotesIcon,
  CodeIcon,
  SmileyIcon,
  TableIcon,
} from '@phosphor-icons/react';

const TABLE_MAX = 6;

function TableSizePicker({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const { t } = useTranslation('groups');
  const [hover, setHover] = useState({ rows: 0, cols: 0 });

  return (
    <div
      className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-3 shadow-md"
      data-testid="table-size-picker"
    >
      <div className="flex flex-col gap-0.5" onMouseLeave={() => setHover({ rows: 0, cols: 0 })}>
        {Array.from({ length: TABLE_MAX }, (_, r) => (
          <div key={r} className="flex gap-0.5">
            {Array.from({ length: TABLE_MAX }, (_, c) => (
              <div
                key={c}
                data-testid={`table-cell-${r + 1}-${c + 1}`}
                className={`size-5 cursor-pointer rounded-sm border transition-colors ${
                  r < hover.rows && c < hover.cols
                    ? 'border-primary bg-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                onMouseEnter={() => setHover({ rows: r + 1, cols: c + 1 })}
                onClick={() => {
                  if (hover.rows > 0 && hover.cols > 0) onSelect(hover.rows, hover.cols);
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {hover.rows > 0 && hover.cols > 0
          ? `${hover.rows} × ${hover.cols}`
          : t('editor.tablePickerHint')}
      </p>
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center rounded p-1.5 transition-colors disabled:opacity-40 ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

interface EmojiData {
  native: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxLength = 2000,
  disabled = false,
}: RichTextEditorProps) {
  const { t } = useTranslation('groups');
  const { resolvedTheme } = useTheme();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showEmojiPicker && !showTablePicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiContainerRef.current &&
        !emojiContainerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        showTablePicker &&
        tableContainerRef.current &&
        !tableContainerRef.current.contains(e.target as Node)
      ) {
        setShowTablePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showTablePicker]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: maxLength }),
      Markdown.configure({ html: false, transformPastedText: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      // @ts-expect-error - tiptap-markdown adds .markdown to storage but it's absent from Tiptap's Storage type
      const md = e.storage.markdown as { getMarkdown: () => string };
      onChange(md.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[80px] px-3 py-2 focus:outline-none',
      },
    },
    immediatelyRender: true,
  });

  const charCount = editor?.storage.characterCount.characters() ?? 0;

  const handleEmojiSelect = (emoji: EmojiData) => {
    editor?.chain().focus().insertContent(emoji.native).run();
    setShowEmojiPicker(false);
  };

  const handleTableInsert = (rows: number, cols: number) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShowTablePicker(false);
  };

  return (
    <div className="rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor?.isActive('heading', { level: 1 }) ?? false}
          disabled={!editor || disabled}
          title={t('editor.heading1')}
        >
          <TextHOneIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor?.isActive('heading', { level: 2 }) ?? false}
          disabled={!editor || disabled}
          title={t('editor.heading2')}
        >
          <TextHTwoIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor?.isActive('heading', { level: 3 }) ?? false}
          disabled={!editor || disabled}
          title={t('editor.heading3')}
        >
          <TextHThreeIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive('bold') ?? false}
          disabled={!editor || disabled}
          title={t('editor.bold')}
        >
          <TextBIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          isActive={editor?.isActive('italic') ?? false}
          disabled={!editor || disabled}
          title={t('editor.italic')}
        >
          <TextItalicIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive('bulletList') ?? false}
          disabled={!editor || disabled}
          title={t('editor.bulletList')}
        >
          <ListBulletsIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive('orderedList') ?? false}
          disabled={!editor || disabled}
          title={t('editor.orderedList')}
        >
          <ListNumbersIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          isActive={editor?.isActive('blockquote') ?? false}
          disabled={!editor || disabled}
          title={t('editor.blockquote')}
        >
          <QuotesIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleCode().run()}
          isActive={editor?.isActive('code') ?? false}
          disabled={!editor || disabled}
          title={t('editor.code')}
        >
          <CodeIcon className="size-4" aria-hidden="true" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <div ref={tableContainerRef} className="relative">
          <ToolbarButton
            onClick={() => setShowTablePicker((prev) => !prev)}
            isActive={showTablePicker}
            disabled={!editor || disabled}
            title={t('editor.table')}
          >
            <TableIcon className="size-4" aria-hidden="true" />
          </ToolbarButton>
          {showTablePicker && <TableSizePicker onSelect={handleTableInsert} />}
        </div>
        <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
        <div ref={emojiContainerRef} className="relative">
          <ToolbarButton
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            isActive={showEmojiPicker}
            disabled={!editor || disabled}
            title={t('editor.emoji')}
          >
            <SmileyIcon className="size-4" aria-hidden="true" />
          </ToolbarButton>
          {showEmojiPicker && (
            <div className="absolute left-0 top-full z-50 mt-1">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                locale={t('editor.emojiLocale')}
              />
            </div>
          )}
        </div>
      </div>
      <EditorContent editor={editor} />
      <div className="flex justify-end px-3 py-1">
        <span
          className={`text-xs ${charCount >= maxLength ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}
