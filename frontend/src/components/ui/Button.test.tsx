import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('deve renderizar o botão com texto', () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('deve chamar onClick quando clicado', async () => {
    // Arrange
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);

    // Act
    await user.click(screen.getByRole('button'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve ser desabilitado quando disabled=true', async () => {
    // Arrange
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button disabled onClick={handleClick}>Click</Button>);

    // Act
    await user.click(screen.getByRole('button'));

    // Assert
    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('deve ser desabilitado durante loading', () => {
    // Arrange & Act
    render(<Button isLoading>Loading</Button>);

    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('deve aplicar estilos da variante primary', () => {
    // Arrange & Act
    render(<Button variant="primary">Primary</Button>);

    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#007AFF]');
  });

  it('deve aplicar estilos da variante secondary', () => {
    // Arrange & Act
    render(<Button variant="secondary">Secondary</Button>);

    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-[#F5F5F7]');
  });

  it('deve aceitar className customizado', () => {
    // Arrange & Act
    render(<Button className="custom-class">Button</Button>);

    // Assert
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });
});
