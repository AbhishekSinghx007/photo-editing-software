'use client'

import { useCallback, useState } from 'react'
import { INITIAL_STATE, type EditorState } from './types'

type History = {
  past: EditorState[]
  committed: EditorState
  present: EditorState
  future: EditorState[]
}

const LIMIT = 100

export function useEditorHistory() {
  const [history, setHistory] = useState<History>({
    past: [],
    committed: INITIAL_STATE,
    present: INITIAL_STATE,
    future: [],
  })

  const update = useCallback(
    (updater: (s: EditorState) => EditorState, commit = true) => {
      setHistory((h) => {
        const present = updater(h.present)
        if (!commit) return { ...h, present }
        if (present === h.committed) return h
        return {
          past: [...h.past, h.committed].slice(-LIMIT),
          committed: present,
          present,
          future: [],
        }
      })
    },
    [],
  )

  const commit = useCallback(() => {
    setHistory((h) =>
      h.present === h.committed
        ? h
        : { past: [...h.past, h.committed].slice(-LIMIT), committed: h.present, present: h.present, future: [] },
    )
  }, [])

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h
      const prev = h.past[h.past.length - 1]
      return { past: h.past.slice(0, -1), committed: prev, present: prev, future: [h.committed, ...h.future] }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h
      const [next, ...rest] = h.future
      return { past: [...h.past, h.committed], committed: next, present: next, future: rest }
    })
  }, [])

  const reset = useCallback((state: EditorState = INITIAL_STATE) => {
    setHistory({ past: [], committed: state, present: state, future: [] })
  }, [])

  return {
    state: history.present,
    update,
    commit,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}
