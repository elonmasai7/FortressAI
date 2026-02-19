import { render, screen } from '@testing-library/react';
import { Slide1 } from '@/components/slides/Slide1';

describe('Slide1', () => {
  it('shows key title and cyber attack stat text', () => {
    render(<Slide1 />);

    expect(screen.getByText('FORTRESSAI')).toBeInTheDocument();
    expect(screen.getByText(/15,877 cyber attacks hit hong kong in 2025/i)).toBeInTheDocument();
  });
});
