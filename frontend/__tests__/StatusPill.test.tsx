import { render, screen } from '@testing-library/react';
import { StatusPill } from '@/components/ui/StatusPill';

describe('StatusPill', () => {
  it('renders safe state', () => {
    render(<StatusPill status="SAFE" />);
    expect(screen.getByText('SAFE')).toBeInTheDocument();
  });

  it('renders alert state', () => {
    render(<StatusPill status="ALERT" />);
    expect(screen.getByText('ALERT')).toBeInTheDocument();
  });
});
