import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

function safeUrlTransform(url: string): string {
  try {
    const { protocol } = new URL(url, 'http://x');
    return ALLOWED_PROTOCOLS.includes(protocol) ? url : '#';
  } catch {
    return '#';
  }
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`prose-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={safeUrlTransform}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
