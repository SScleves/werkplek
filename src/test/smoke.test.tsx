import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { db } from '../db/db'

describe('FlowDeck app', () => {
  beforeEach(async () => {
    // Reset the URL — BrowserRouter reads jsdom's shared history
    window.history.pushState({}, '', '/')
    // Fresh database per test run
    await db.delete()
    await db.open()
  })

  it('seeds data and renders the dashboard with the starter task', async () => {
    render(<App />)
    // Seeding + first render
    await waitFor(
      () => expect(screen.getByText(/Welcome to Werkplek/i)).toBeTruthy(),
      { timeout: 5000 },
    )
    // Vocab got seeded
    expect(await db.vocab.count()).toBeGreaterThan(100)
    expect(await db.projects.count()).toBe(2)
  })

  it('navigates to the Dutch game and starts a flashcard session', async () => {
    render(<App />)
    await waitFor(() => screen.getByText(/Welcome to Werkplek/i), {
      timeout: 5000,
    })

    fireEvent.click(screen.getByRole('link', { name: 'Dutch' }))
    await waitFor(() => expect(screen.getByText(/day streak/i)).toBeTruthy())
    // Wait for the vocab deck to finish loading before starting a session
    await waitFor(() =>
      expect(screen.getByText(/[1-9]\d* words in your deck/i)).toBeTruthy(),
    )

    fireEvent.click(screen.getByText('Flashcard quiz'))
    await waitFor(() =>
      expect(screen.getByText(/What does this mean/i)).toBeTruthy(),
    )
  })

  it('navigates to Todos and shows the Inbox project filter', async () => {
    render(<App />)
    await waitFor(() => screen.getByText(/Welcome to Werkplek/i), {
      timeout: 5000,
    })
    fireEvent.click(screen.getByRole('link', { name: 'Todos' }))
    await waitFor(() => expect(screen.getAllByText('Inbox').length).toBeGreaterThan(0))
  })
})
