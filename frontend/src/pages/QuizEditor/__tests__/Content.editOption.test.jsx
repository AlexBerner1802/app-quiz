import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionsContent from '../QuestionsContent.jsx';

test('modifier le texte d’une option appelle setQuestions', async () => {
  const user = userEvent.setup();
  const setQuestions = vi.fn();

  const props = {
    questions: [{ id: 'q1', title: '', description: '', options: ['A', 'B'], correctIndices: [] }],
    setQuestions,
    setIsDirty: vi.fn(),
    title: '',
    setTitle: vi.fn(),
    quiz_description: '',
    setQuizDescription: vi.fn(),
    modules: [],
    selectedModuleIds: [],
    setSelectedModuleIds: vi.fn(),
    selectedTags: [],
    setSelectedTags: vi.fn(),
    selectedTagIds: [],
    setSelectedTagIds: vi.fn(),
    questionRefs: { current: {} },
  };

  render(<QuestionsContent {...props} />);

  const optInput = screen.getByDisplayValue('A');
  await user.clear(optInput);
  await user.type(optInput, 'Alpha');

  await waitFor(() => {
    expect(setQuestions).toHaveBeenCalled();
  });
});
