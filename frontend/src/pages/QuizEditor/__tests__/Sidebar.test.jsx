import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeftSidebar from '../LeftSidebar.jsx';

function Harness() {
  const [questions, setQuestions] = React.useState([]);
  const setIsDirty = vi.fn();
  const questionRefs = React.useRef({});
  const untitled = 'Untitled';

  return (
    <LeftSidebar
      questions={questions}
      setQuestions={setQuestions}
      setIsDirty={setIsDirty}
      questionRefs={questionRefs}
      untitled={untitled}
    />
  );
}

test('the "Add Question" button adds an item', async () => {
  const user = userEvent.setup();
  render(<Harness />);

  await user.click(screen.getByRole('button', { name: /add question/i }));

  // A new "card" displays the default title (untitled)
  expect(screen.getByText(/untitled/i)).toBeInTheDocument();
});
