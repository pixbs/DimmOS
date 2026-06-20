import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CountUp } from '@/components/animation/count-up'

describe('CountUp', () => {
  it('exposes the original string to screen readers', () => {
    const { container } = render(<CountUp>1,200+</CountUp>)
    const srOnly = container.querySelector('.sr-only')
    expect(srOnly?.textContent).toBe('1,200+')
  })

  it('keeps a leading prefix in the accessible value', () => {
    const { container } = render(<CountUp>$98</CountUp>)
    expect(container.querySelector('.sr-only')?.textContent).toBe('$98')
  })

  it('renders the number and the affixes as distinct spans', () => {
    const { container } = render(<CountUp>50%</CountUp>)
    expect(container.querySelector('[data-count-number]')).toBeTruthy()
    expect(container.querySelector('[data-count-affix]')?.textContent).toBe('%')
  })

  it('splits a leading prefix and trailing suffix into separate affix spans', () => {
    const { container } = render(<CountUp>$1.2K</CountUp>)
    const affixes = Array.from(container.querySelectorAll('[data-count-affix]')).map(
      (n) => n.textContent,
    )
    expect(affixes).toEqual(['$', 'K'])
  })

  it('preserves the original decimals in the accessible value', () => {
    const { container } = render(<CountUp>3.5x</CountUp>)
    expect(container.querySelector('.sr-only')?.textContent).toBe('3.5x')
  })
})
