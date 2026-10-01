// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { setupIonicReact } from '@ionic/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SnippetsProvider } from '../../state/SnippetsContext';
import Home from '../Home';

setupIonicReact();

const renderHome = () =>
  render(
    <SnippetsProvider>
      <Home />
    </SnippetsProvider>,
  );

// The edit modal (IonModal) does not run under jsdom; the add/edit/delete
// logic it calls is covered in src/state/__tests__/SnippetsContext.test.tsx.
describe('Snippets Home list', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it('filters by tag chip and toggles back', () => {
    const { container } = renderHome();
    expect(container.textContent).toContain('Debounce a function');
    fireEvent.click(screen.getByLabelText('Tag git, 1'));
    expect(container.textContent).not.toContain('Debounce a function');
    expect(container.textContent).toContain('Undo last commit');
    fireEvent.click(screen.getByLabelText('Tag git, 1'));
    expect(container.textContent).toContain('Debounce a function');
  });

  it('filter chips work from the keyboard', () => {
    const { container } = renderHome();
    const chip = screen.getByLabelText('Favourites only');
    expect(chip.getAttribute('tabindex')).toBe('0');
    fireEvent.keyDown(chip, { key: 'Enter' });
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(container.textContent).not.toContain('Undo last commit');
  });

  it('favourites a snippet from the list', () => {
    renderHome();
    fireEvent.click(screen.getByLabelText('Favourite Undo last commit (keep changes)'));
    expect(screen.getByLabelText('Unfavourite Undo last commit (keep changes)')).toBeTruthy();
  });
});
