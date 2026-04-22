import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  it('deve desabilitar o botão quando input está vazio', () => {
    // Arrange & Act
    render(<TaskForm onSubmit={jest.fn()} />);

    // Assert
    expect(
      screen.getByRole('button', { name: /Adicionar Tarefa/i }),
    ).toBeDisabled();
  });

  it('deve habilitar o botão quando há texto', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<TaskForm onSubmit={jest.fn()} />);

    // Act
    await user.type(screen.getByLabelText('Task title'), 'Nova tarefa');

    // Assert
    expect(
      screen.getByRole('button', { name: /Adicionar Tarefa/i }),
    ).not.toBeDisabled();
  });

  it('deve chamar onSubmit com o título ao enviar', async () => {
    // Arrange
    const handleSubmit = jest.fn();
    const user = userEvent.setup();

    render(<TaskForm onSubmit={handleSubmit} />);

    // Act
    await user.type(screen.getByLabelText('Task title'), 'Nova tarefa');
    await user.click(screen.getByRole('button'));

    // Assert
    expect(handleSubmit).toHaveBeenCalledWith('Nova tarefa');
  });

  it('deve limpar o input após criação bem-sucedida', async () => {
    // Arrange
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<TaskForm onSubmit={handleSubmit} />);

    const input = screen.getByLabelText('Task title') as HTMLInputElement;

    // Act
    await user.type(input, 'Nova tarefa');
    await user.click(screen.getByRole('button'));

    // Assert
    expect(input.value).toBe('');
  });

  it('deve exibir erro quando onSubmit falha', async () => {
    // Arrange
    const handleSubmit = jest.fn().mockRejectedValue(
      new Error('Server error'),
    );
    const user = userEvent.setup();

    render(<TaskForm onSubmit={handleSubmit} />);

    // Act
    await user.type(screen.getByLabelText('Task title'), 'Nova tarefa');
    await user.click(screen.getByRole('button'));

    // Assert
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('deve desabilitar inputs durante envio', async () => {
    // Arrange
    const handleSubmit = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    const user = userEvent.setup();

    render(<TaskForm onSubmit={handleSubmit} />);

    // Act
    await user.type(screen.getByLabelText('Task title'), 'Nova tarefa');
    await user.click(screen.getByRole('button'));

    // Assert — input deve estar desabilitado durante envio
    expect(screen.getByLabelText('Task title')).toBeDisabled();
  });

  it('deve não desabilitar campos quando isLoading=false', () => {
    // Arrange & Act
    render(<TaskForm onSubmit={jest.fn()} isLoading={false} />);

    // Assert
    expect(screen.getByLabelText('Task title')).not.toBeDisabled();
  });

  it('deve desabilitar campos quando isLoading=true', () => {
    // Arrange & Act
    render(<TaskForm onSubmit={jest.fn()} isLoading={true} />);

    // Assert
    expect(screen.getByLabelText('Task title')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /Adicionar Tarefa/i }),
    ).toBeDisabled();
  });
});
