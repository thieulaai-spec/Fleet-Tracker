import { render, screen } from '@testing-library/react'

describe('Smoke Test', () => {
  it('should render a basic element', () => {
    render(<div>Hello FleetTracker</div>)
    expect(screen.getByText('Hello FleetTracker')).toBeInTheDocument()
  })
})
