import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AnimatedText } from '@/components/animation/animated-text'

describe('AnimatedText', () => {
  it('renders the full text once for screen readers', () => {
    const { container } = render(<AnimatedText>Design Systems</AnimatedText>)
    const srOnly = container.querySelector('.sr-only')
    expect(srOnly?.textContent).toBe('Design Systems')
  })

  it('marks the animated copy aria-hidden so readers ignore the split units', () => {
    const { container } = render(<AnimatedText>Design Systems</AnimatedText>)
    const hidden = container.querySelector('[aria-hidden="true"]')
    expect(hidden).toBeTruthy()
  })

  it('emits one animated unit per word in words mode', () => {
    const { container } = render(<AnimatedText split="words">one two three</AnimatedText>)
    expect(container.querySelectorAll('[data-animated-unit]')).toHaveLength(3)
  })

  it('emits one animated unit per letter in letters mode', () => {
    const { container } = render(<AnimatedText split="letters">ab cd</AnimatedText>)
    // a, b, c, d
    expect(container.querySelectorAll('[data-animated-unit]')).toHaveLength(4)
  })

  it('renders with the requested wrapper element', () => {
    const { container } = render(<AnimatedText as="h1">Title</AnimatedText>)
    expect(container.querySelector('h1')).toBeTruthy()
  })

  it('passes classes to the animated visual copy', () => {
    const { container } = render(<AnimatedText innerClassName="justify-center">Centered Title</AnimatedText>)
    expect(container.querySelector('[aria-hidden="true"]')?.className).toContain('justify-center')
  })
})
