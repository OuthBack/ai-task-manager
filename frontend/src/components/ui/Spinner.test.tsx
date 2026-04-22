import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('deve renderizar o spinner', () => {
    // Arrange & Act
    render(<Spinner />);

    // Assert
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('deve ter classe animate-spin', () => {
    // Arrange & Act
    render(<Spinner />);

    // Assert
    const spinner = screen.getByLabelText('loading');
    expect(spinner).toHaveClass('animate-spin');
  });
});
