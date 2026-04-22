import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('deve exibir mensagem de erro', () => {
    // Arrange & Act
    render(<ErrorMessage message="An error occurred" />);

    // Assert
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('deve chamar onDismiss quando botão de fechar é clicado', async () => {
    // Arrange
    const handleDismiss = jest.fn();
    const user = userEvent.setup();

    render(
      <ErrorMessage message="Error" onDismiss={handleDismiss} />,
    );

    // Act
    await user.click(screen.getByLabelText('Close error'));

    // Assert
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('não deve exibir botão de fechar sem onDismiss', () => {
    // Arrange & Act
    render(<ErrorMessage message="Error" />);

    // Assert
    expect(screen.queryByLabelText('Close error')).not.toBeInTheDocument();
  });

  it('deve ter classe com cor de erro', () => {
    // Arrange & Act
    render(<ErrorMessage message="Error" />);

    // Assert
    const container = screen.getByText('Error').parentElement;
    expect(container).toHaveClass('bg-[#FF3B30]/10');
  });
});
