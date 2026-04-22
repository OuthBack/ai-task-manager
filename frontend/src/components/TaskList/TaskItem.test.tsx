import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from './TaskItem';
import type { Task } from '@/types/task.types';

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  isCompleted: false,
  isAiGenerated: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('TaskItem', () => {
  it('deve renderizar o título da tarefa', () => {
    // Arrange & Act
    render(
      <TaskItem
        task={mockTask}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('deve exibir checkbox', () => {
    // Arrange & Act
    render(
      <TaskItem
        task={mockTask}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // Assert
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('deve chamar onToggle quando checkbox é clicado', async () => {
    // Arrange
    const handleToggle = jest.fn();
    const user = userEvent.setup();

    render(
      <TaskItem
        task={mockTask}
        onToggle={handleToggle}
        onDelete={jest.fn()}
      />,
    );

    // Act
    await user.click(screen.getByRole('checkbox'));

    // Assert
    expect(handleToggle).toHaveBeenCalledWith('1');
  });

  it('deve chamar onDelete quando botão de deletar é clicado', async () => {
    // Arrange
    const handleDelete = jest.fn();
    const user = userEvent.setup();

    render(
      <TaskItem
        task={mockTask}
        onToggle={jest.fn()}
        onDelete={handleDelete}
      />,
    );

    // Act
    await user.click(screen.getByLabelText('Delete task: Test Task'));

    // Assert
    expect(handleDelete).toHaveBeenCalledWith('1');
  });

  it('deve exibir badge quando tarefa é gerada por IA', () => {
    // Arrange
    const aiTask = { ...mockTask, isAiGenerated: true };

    // Act
    render(
      <TaskItem
        task={aiTask}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('✨ IA')).toBeInTheDocument();
  });

  it('deve aplicar strikethrough quando tarefa está completa', () => {
    // Arrange
    const completedTask = { ...mockTask, isCompleted: true };

    // Act
    render(
      <TaskItem
        task={completedTask}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // Assert
    const title = screen.getByText('Test Task');
    expect(title).toHaveClass('line-through');
  });

  it('deve desabilitar interações durante processamento', async () => {
    // Arrange
    const handleToggle = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    const user = userEvent.setup();

    render(
      <TaskItem
        task={mockTask}
        onToggle={handleToggle}
        onDelete={jest.fn()}
      />,
    );

    // Act
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Assert — checkbox deve estar desabilitado durante processamento
    expect(checkbox).toBeDisabled();
  });
});
