import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { CountUp } from '@/components/animation/count-up'

describe('CountUp', () => {
  it('exposes the final value with affixes to screen readers', () => {
    const { container } = render(<CountUp value={42} suffix="+" />)
    const srOnly = container.querySelector('.sr-only')
    expect(srOnly?.textContent).toBe('42+')
  })

  it('includes the prefix in the accessible value', () => {
    const { container } = render(<CountUp value={98} prefix="$" />)
    expect(container.querySelector('.sr-only')?.textContent).toBe('$98')
  })

  it('renders the number and the affix as distinct spans', () => {
    const { container } = render(<CountUp value={50} suffix="%" />)
    expect(container.querySelector('[data-count-number]')).toBeTruthy()
    expect(container.querySelector('[data-count-affix]')?.textContent).toBe('%')
  })

  it('formats with the requested decimal places', () => {
    const { container } = render(<CountUp value={3.5} decimals={1} />)
    expect(container.querySelector('.sr-only')?.textContent).toContain('3.5')
  })
})
