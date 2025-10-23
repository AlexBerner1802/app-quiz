import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewQuiz from '../_index.jsx';

vi.mock('react-router-dom', async (orig) => {
  const actual = await orig();
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({}) };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => ({
      'actions.addQuestion': 'Ajouter une question',
      'quiz.placeholders.untitled': 'Sans titre',
      'common.untitled': 'Sans titre',
      'pages.createPage': 'Créer un quiz',
      'actions.saveChanges': 'Enregistrer',
      'quiz.sections.questions': 'Questions',
      'quiz.sections.descriptionAdd': 'Ajouter une description'
    }[key] ?? key),
  }),
}));

vi.mock('../../../components/layout/Header', () => ({
  default: ({ actions }) => <div data-testid="header">{actions}</div>
}));

vi.mock('../../../components/UnsavedChangesGuard', () => ({ default: () => null }));
vi.mock('../../../components/buttons/ToggleSwitchButton', () => ({ default: () => <div /> }));
vi.mock('../../../components/ui/LanguageSelector', () => ({ default: () => <div /> }));
vi.mock('../../../components/ui/Input', () => ({ default: (p) => <input {...p} /> }));
vi.mock('../../../components/ui/TextArea', () => ({ default: (p) => <textarea {...p} /> }));
vi.mock('../../../components/ui/ImageUploader', () => ({ default: () => <div /> }));
vi.mock('../../../components/ui/CheckboxGroup', () => ({ default: () => <div /> }));
vi.mock('../../../components/ui/CheckBox', () => ({ default: (p) => <input type="checkbox" {...p} /> }));
vi.mock('../../../components/ui/TagInput', () => ({ default: () => <div /> }));
vi.mock('../../../components/layout/Icon.jsx', () => ({ default: () => null }));

vi.mock('../../../services/api', () => ({
  getModules: () => Promise.resolve([]),
  getTags: () => Promise.resolve([]),
  createQuiz: vi.fn(),
  updateQuiz: vi.fn(),
  getQuiz: vi.fn()
}));

test('cliquer "Ajouter une question" insère une question dans la liste', async () => {
  const user = userEvent.setup();
  render(<NewQuiz />);

  const addBtns = screen.getAllByRole('button', { name: /ajouter une question/i });
  await user.click(addBtns[0]);

  await waitFor(() => {
    expect(screen.getByText(/sans titre/i)).toBeInTheDocument();
  });
});
