import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../ui/Button.jsx';

test('call onClick when we click', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();

  render(<Button onClick={handleClick}>Click here!!!</Button>);
  await user.click(screen.getByRole('button', { name: /Click here!!!/i }));

  expect(handleClick).toHaveBeenCalledTimes(1);
});

test('doesn\'t launch onClick when disabled', async () => {
  const user = userEvent.setup();
  const handleClick = vi.fn();

  render(<Button onClick={handleClick} disabled>Deactivated</Button>);
  const btn = screen.getByRole('button', { name: /deactivated/i });

  expect(btn).toBeDisabled();
  await user.click(btn);
  expect(handleClick).not.toHaveBeenCalled();
});
