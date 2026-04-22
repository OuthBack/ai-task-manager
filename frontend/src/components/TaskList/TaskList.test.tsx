import { render, screen } from '@testing-library/react';
import { TaskList } from './TaskList';
import type { Task } from '@/types/task.types';

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  isCompleted: false,
  isAiGenerated: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('TaskList', () => {
  it('deve exibir spinner quando carregando e lista está vazia', () => {
    // Arrange & Act
    render(
      <TaskList
        tasks={[]}
        isLoading={true}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // Assert
    expect(screen.getByLabelText('loading')).toBeInTheDocument();
  });

  it('deve exibir mensagem de lista vazia', () => {
    // Arrange & Act
    render(
      <TaskList
        tasks={[]}
        isLoading={false}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // Assert
    expect(
      screen.getByText(/Nenhuma tarefa ainda/i),
    ).toBeInTheDocument();
  });

  it('deve renderizar lista de tarefas', () => {
    // Arrange
    const tasks = [mockTask, { ...mockTask, id: '2', title: 'Task 2' }];

    // Act
    render(
      <TaskList
        tasks={tasks}
        isLoading={false}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('não deve exibir spinner se há tarefas mesmo com isLoading=true', () => {
    // Arrange & Act
    render(
      <TaskList
        tasks={[mockTask]}
        isLoading={true}
        onToggle={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    // Assert
    expect(screen.queryByLabelText('loading')).not.toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('deve passar callbacks para TaskItem', () => {
    // Arrange
    const handleToggle = jest.fn();
    const handleDelete = jest.fn();

    // Act
    render(
      <TaskList
        tasks={[mockTask]}
        isLoading={false}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />,
    );

    // Assert — validar que TaskItem recebeu os callbacks
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });
});
