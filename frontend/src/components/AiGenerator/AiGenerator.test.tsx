import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiGenerator } from './AiGenerator';

describe('AiGenerator', () => {
  it('deve desabilitar o botão quando campos estão vazios', () => {
    // Arrange & Act
    render(<AiGenerator onGenerate={jest.fn()} />);

    // Assert
    expect(
      screen.getByRole('button', { name: /Gerar com IA/i }),
    ).toBeDisabled();
  });

  it('deve desabilitar o botão quando falta objetivo', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AiGenerator onGenerate={jest.fn()} />);

    // Act
    await user.type(
      screen.getByLabelText('Gemini API Key'),
      'test-api-key',
    );

    // Assert
    expect(
      screen.getByRole('button', { name: /Gerar com IA/i }),
    ).toBeDisabled();
  });

  it('deve desabilitar o botão quando falta API Key', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AiGenerator onGenerate={jest.fn()} />);

    // Act
    await user.type(
      screen.getByLabelText('AI objective'),
      'Learn Next.js',
    );

    // Assert
    expect(
      screen.getByRole('button', { name: /Gerar com IA/i }),
    ).toBeDisabled();
  });

  it('deve habilitar o botão quando preenchido', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AiGenerator onGenerate={jest.fn()} />);

    // Act
    await user.type(
      screen.getByLabelText('AI objective'),
      'Learn Next.js',
    );
    await user.type(
      screen.getByLabelText('Gemini API Key'),
      'test-api-key',
    );

    // Assert
    expect(
      screen.getByRole('button', { name: /Gerar com IA/i }),
    ).not.toBeDisabled();
  });

  it('deve chamar onGenerate com objetivo e apiKey', async () => {
    // Arrange
    const handleGenerate = jest.fn();
    const user = userEvent.setup();

    render(<AiGenerator onGenerate={handleGenerate} />);

    // Act
    await user.type(
      screen.getByLabelText('AI objective'),
      'Learn Next.js',
    );
    await user.type(
      screen.getByLabelText('Gemini API Key'),
      'test-api-key',
    );
    await user.click(screen.getByRole('button'));

    // Assert
    expect(handleGenerate).toHaveBeenCalledWith('Learn Next.js', 'test-api-key');
  });

  it('deve limpar campos após geração bem-sucedida', async () => {
    // Arrange
    const handleGenerate = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AiGenerator onGenerate={handleGenerate} />);

    const objective = screen.getByLabelText('AI objective') as HTMLInputElement;
    const apiKey = screen.getByLabelText('Gemini API Key') as HTMLInputElement;

    // Act
    await user.type(objective, 'Learn Next.js');
    await user.type(apiKey, 'test-api-key');
    await user.click(screen.getByRole('button'));

    // Assert
    expect(objective.value).toBe('');
    expect(apiKey.value).toBe('');
  });

  it('deve exibir mensagem de sucesso após geração', async () => {
    // Arrange
    const handleGenerate = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AiGenerator onGenerate={handleGenerate} />);

    // Act
    await user.type(
      screen.getByLabelText('AI objective'),
      'Learn',
    );
    await user.type(
      screen.getByLabelText('Gemini API Key'),
      'test-api-key',
    );
    await user.click(screen.getByRole('button'));

    // Assert
    expect(screen.getByText(/Tarefas geradas com sucesso/i)).toBeInTheDocument();
  });

  it('deve exibir erro quando fornecido', () => {
    // Arrange & Act
    render(
      <AiGenerator
        onGenerate={jest.fn()}
        error="Erro na requisição"
      />,
    );

    // Assert
    expect(screen.getByText('Erro na requisição')).toBeInTheDocument();
  });

  it('deve desabilitar campos e mostrar spinner durante loading', () => {
    // Arrange & Act
    render(
      <AiGenerator onGenerate={jest.fn()} isLoading={true} />,
    );

    // Assert
    expect(screen.getByLabelText('AI objective')).toBeDisabled();
    expect(screen.getByLabelText('Gemini API Key')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /Gerando tarefas/i }),
    ).toBeDisabled();
  });
});
