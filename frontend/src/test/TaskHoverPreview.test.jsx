import { cleanup, fireEvent, render, screen, within, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TaskHoverPreview from '../components/common/TaskHoverPreview.jsx';

const task = {
  title: 'Prepare assessment',
  description: 'Include API authorization tests and installation instructions.',
  status: 'in-progress',
  priority: 'high',
  createdAt: '2026-10-01',
};

const mount = () => render(<TaskHoverPreview task={task}>Task row</TaskHoverPreview>);

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Task hover preview', () => {
  it('shows task details on hover and closes after leaving', () => {
    vi.useFakeTimers();
    mount();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByText('Task row'));
    const preview = within(screen.getByRole('tooltip'));
    expect(preview.getByText(task.description)).toBeInTheDocument();
    expect(preview.getByText(/in progress/i)).toBeInTheDocument();
    expect(preview.getByText('high priority')).toBeInTheDocument();
    expect(preview.getByText('No due date')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByText('Task row'));
    act(() => vi.advanceTimersByTime(121));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('stays open when moving into the popup to read longer details', () => {
    vi.useFakeTimers();
    mount();
    fireEvent.mouseEnter(screen.getByText('Task row'));
    fireEvent.mouseLeave(screen.getByText('Task row'));
    fireEvent.mouseEnter(screen.getByRole('tooltip'));
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('supports keyboard focus and Escape dismissal', () => {
    mount();
    const row = screen.getByText('Task row');
    fireEvent.focus(row);
    expect(row).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
    fireEvent.keyDown(row, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
