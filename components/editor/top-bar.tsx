'use client'

import { Aperture, Download, FolderOpen, Maximize, Minus, Plus, Redo2, SplitSquareHorizontal, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TopBarProps = {
  hasImage: boolean
  fileName: string
  dimensions: { w: number; h: number } | null
  canUndo: boolean
  canRedo: boolean
  scale: number
  onOpen: () => void
  onUndo: () => void
  onRedo: () => void
  onCompare: (active: boolean) => void
  onZoom: (zoom: number | 'fit') => void
  onExport: () => void
}

export function TopBar({
  hasImage,
  fileName,
  dimensions,
  canUndo,
  canRedo,
  scale,
  onOpen,
  onUndo,
  onRedo,
  onCompare,
  onZoom,
  onExport,
}: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-panel px-3">
      <div className="flex items-center gap-2 pr-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Aperture className="size-4" aria-hidden="true" />
        </span>
        <span className="hidden text-sm font-semibold tracking-tight sm:inline">Lumen</span>
      </div>

      <Button variant="ghost" size="sm" onClick={onOpen}>
        <FolderOpen data-icon="inline-start" />
        <span className="hidden sm:inline">Open</span>
      </Button>

      {hasImage && (
        <div className="hidden min-w-0 flex-col leading-tight md:flex">
          <span className="truncate text-xs font-medium">{fileName}</span>
          {dimensions && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {dimensions.w} × {dimensions.h}
            </span>
          )}
        </div>
      )}

      <div className="flex-1" />

      {hasImage && (
        <>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘Z)">
              <Undo2 />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
              <Redo2 />
            </Button>
          </div>

          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

          <div className="hidden items-center gap-0.5 sm:flex">
            <Button variant="ghost" size="icon" onClick={() => onZoom(scale / 1.25)} aria-label="Zoom out">
              <Minus />
            </Button>
            <button
              type="button"
              onClick={() => onZoom(1)}
              title="Actual size"
              className="w-12 rounded-md py-1 text-center font-mono text-xs tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {Math.round(scale * 100)}%
            </button>
            <Button variant="ghost" size="icon" onClick={() => onZoom(scale * 1.25)} aria-label="Zoom in">
              <Plus />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onZoom('fit')} aria-label="Fit to screen" title="Fit to screen">
              <Maximize />
            </Button>
          </div>

          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

          <Button
            variant="ghost"
            size="sm"
            onPointerDown={() => onCompare(true)}
            onPointerUp={() => onCompare(false)}
            onPointerLeave={() => onCompare(false)}
            onPointerCancel={() => onCompare(false)}
            title="Hold to compare with original (\)"
            className="select-none"
          >
            <SplitSquareHorizontal data-icon="inline-start" />
            <span className="hidden sm:inline">Compare</span>
          </Button>

          <Button size="sm" onClick={onExport} className="ml-1">
            <Download data-icon="inline-start" />
            Export
          </Button>
        </>
      )}
    </header>
  )
}
