import { fireEvent, render, screen } from '@testing-library/react';
import { Slide6 } from '@/components/slides/Slide6';

describe('Slide6 demo flow', () => {
  it('starts demo simulation when button is clicked', () => {
    const complete = jest.fn();
    render(<Slide6 onDemoComplete={complete} />);

    fireEvent.click(screen.getByRole('button', { name: /simulate 30s demo/i }));

    expect(screen.getByText(/safe dashboard switches to green/i)).toBeInTheDocument();
  });
});
