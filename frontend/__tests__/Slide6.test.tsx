import { fireEvent, render, screen } from '@testing-library/react';
import { Slide6 } from '@/components/slides/Slide6';

describe('Slide6 demo flow', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('starts demo simulation when button is clicked', async () => {
    const complete = jest.fn();
    render(<Slide6 onDemoComplete={complete} />);

    fireEvent.click(screen.getByRole('button', { name: /simulate 30s demo/i }));

    await screen.findByText(/connected to backend api/i);
    expect(screen.getByText(/safe dashboard switches to green/i)).toBeInTheDocument();
  });
});
