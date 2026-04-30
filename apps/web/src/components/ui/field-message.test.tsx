import { render, screen } from '@testing-library/react';

import { FieldMessage } from './field-message';

describe('FieldMessage', () => {
  it('renders error message when error is provided', () => {
    render(<FieldMessage error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders hint message when hint is provided', () => {
    render(<FieldMessage hint="Helpful hint" />);
    expect(screen.getByText('Helpful hint')).toBeInTheDocument();
  });

  it('renders error and not hint when both are provided', () => {
    render(<FieldMessage error="Error text" hint="Hint text" />);
    expect(screen.getByText('Error text')).toBeInTheDocument();
    expect(screen.queryByText('Hint text')).not.toBeInTheDocument();
  });

  it('renders nothing when neither error nor hint is provided', () => {
    const { container } = render(<FieldMessage />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when error is null and no hint', () => {
    const { container } = render(<FieldMessage error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('applies custom className to error paragraph', () => {
    render(<FieldMessage error="Error" className="text-xs" />);
    expect(screen.getByText('Error')).toHaveClass('text-xs');
  });

  it('applies custom className to hint paragraph', () => {
    render(<FieldMessage hint="Hint" className="text-xs" />);
    expect(screen.getByText('Hint')).toHaveClass('text-xs');
  });

  it('error paragraph has text-destructive class', () => {
    render(<FieldMessage error="Error" />);
    expect(screen.getByText('Error')).toHaveClass('text-destructive');
  });

  it('hint paragraph has text-muted-foreground class', () => {
    render(<FieldMessage hint="Hint" />);
    expect(screen.getByText('Hint')).toHaveClass('text-muted-foreground');
  });
});
