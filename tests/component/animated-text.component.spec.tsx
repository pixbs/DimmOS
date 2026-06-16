import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AnimatedText } from '@/components/animation/animated-text'

describe('AnimatedText', () => {
  it('renders the full text once for screen readers', () => {
    const { container } = render(<AnimatedText text="Design Systems" />)
    const srOnly = container.querySelector('.sr-only')
    expect(srOnly?.textContent).toBe('Design Systems')
  })

  it('marks the animated copy aria-hidden so readers ignore the split units', () => {
    const { container } = render(<AnimatedText text="Design Systems" />)
    const hidden = container.querySelector('[aria-hidden="true"]')
    expect(hidden).toBeTruthy()
  })

  it('emits one animated unit per word in words mode', () => {
    const { container } = render(<AnimatedText text="one two three" split="words" />)
    expect(container.querySelectorAll('[data-animated-unit]')).toHaveLength(3)
  })

  it('emits one animated unit per letter in letters mode', () => {
    const { container } = render(<AnimatedText text="ab cd" split="letters" />)
    // a, b, c, d
    expect(container.querySelectorAll('[data-animated-unit]')).toHaveLength(4)
  })

  it('renders with the requested wrapper element', () => {
    const { container } = render(<AnimatedText as="h1" text="Title" />)
    expect(container.querySelector('h1')).toBeTruthy()
  })
})
