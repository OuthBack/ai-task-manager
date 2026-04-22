import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('deve renderizar um input', () => {
    // Arrange & Act
    render(<Input />);

    // Assert
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('deve exibir label quando fornecido', () => {
    // Arrange & Act
    render(<Input label="Name" />);

    // Assert
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro quando fornecida', () => {
    // Arrange & Act
    render(<Input error="Este campo é obrigatório" />);

    // Assert
    expect(screen.getByText('Este campo é obrigatório')).toBeInTheDocument();
  });

  it('deve aceitar valor do usuário', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Input />);

    const input = screen.getByRole('textbox') as HTMLInputElement;

    // Act
    await user.type(input, 'Texto de teste');

    // Assert
    expect(input.value).toBe('Texto de teste');
  });

  it('deve ser desabilitado quando disabled=true', () => {
    // Arrange & Act
    render(<Input disabled />);

    // Assert
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('deve aceitar placeholder', () => {
    // Arrange & Act
    render(<Input placeholder="Enter name..." />);

    // Assert
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.placeholder).toBe('Enter name...');
  });

  it('deve aceitar type password', () => {
    // Arrange & Act
    render(<Input type="password" />);

    // Assert
    const input = screen.getByDisplayValue('') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
  });

  it('deve aplicar classe customizada', () => {
    // Arrange & Act
    render(<Input className="custom-class" />);

    // Assert
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('deve exibir border vermelha quando há erro', () => {
    // Arrange & Act
    render(<Input error="Error" />);

    // Assert
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-[#FF3B30]');
  });
});
