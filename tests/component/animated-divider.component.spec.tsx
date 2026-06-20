import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AnimatedDivider } from '@/components/animation/animated-divider'

describe('AnimatedDivider', () => {
  it('defaults to a horizontal orientation', () => {
    const { container } = render(<AnimatedDivider />)
    expect(container.querySelector('[data-orientation="horizontal"]')).toBeTruthy()
  })

  it('renders a vertical divider when requested', () => {
    const { container } = render(<AnimatedDivider orientation="vertical" />)
    expect(container.querySelector('[data-orientation="vertical"]')).toBeTruthy()
  })
})
