import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownContent } from './markdown-content';

describe('MarkdownContent', () => {
  it('renders plain text', () => {
    render(<MarkdownContent content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders bold markdown', () => {
    render(<MarkdownContent content="**bold text**" />);
    const strong = document.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe('bold text');
  });

  it('renders italic markdown', () => {
    render(<MarkdownContent content="_italic text_" />);
    const em = document.querySelector('em');
    expect(em).toBeInTheDocument();
    expect(em?.textContent).toBe('italic text');
  });

  it('renders unordered list', () => {
    render(<MarkdownContent content={'- item one\n- item two'} />);
    expect(screen.getByText('item one')).toBeInTheDocument();
    expect(screen.getByText('item two')).toBeInTheDocument();
    expect(document.querySelector('ul')).toBeInTheDocument();
  });

  it('renders ordered list', () => {
    render(<MarkdownContent content={'1. first\n2. second'} />);
    expect(document.querySelector('ol')).toBeInTheDocument();
  });

  it('renders blockquote', () => {
    render(<MarkdownContent content="> quoted text" />);
    expect(document.querySelector('blockquote')).toBeInTheDocument();
  });

  it('renders inline code', () => {
    render(<MarkdownContent content="`some code`" />);
    expect(document.querySelector('code')).toBeInTheDocument();
  });

  it('renders empty content without crashing', () => {
    const { container } = render(<MarkdownContent content="" />);
    expect(container).toBeInTheDocument();
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<MarkdownContent content="text" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('always applies prose-content class', () => {
    const { container } = render(<MarkdownContent content="text" />);
    expect(container.firstChild).toHaveClass('prose-content');
  });

  describe('urlTransform — safe link rendering', () => {
    it('renders https links as-is', () => {
      render(<MarkdownContent content="[visit](https://example.com)" />);
      expect(document.querySelector('a')).toHaveAttribute('href', 'https://example.com');
    });

    it('renders mailto links as-is', () => {
      render(<MarkdownContent content="[email](mailto:user@example.com)" />);
      expect(document.querySelector('a')).toHaveAttribute('href', 'mailto:user@example.com');
    });

    it('replaces javascript: URLs with #', () => {
      render(<MarkdownContent content="[xss](javascript:alert(1))" />);
      expect(document.querySelector('a')).toHaveAttribute('href', '#');
    });

    it('replaces data: URLs with #', () => {
      render(<MarkdownContent content="[data](data:text/html,<h1>hi</h1>)" />);
      expect(document.querySelector('a')).toHaveAttribute('href', '#');
    });

    it('allows relative paths', () => {
      render(<MarkdownContent content="[link](/groups/123)" />);
      expect(document.querySelector('a')).toHaveAttribute('href', '/groups/123');
    });

    it('allows anchor links', () => {
      render(<MarkdownContent content="[anchor](#section)" />);
      expect(document.querySelector('a')).toHaveAttribute('href', '#section');
    });
  });
});
