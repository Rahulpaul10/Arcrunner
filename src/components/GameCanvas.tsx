interface GameCanvasProps {
  onReady: (canvas: HTMLCanvasElement | null) => void
}

export function GameCanvas({ onReady }: GameCanvasProps) {
  return <canvas ref={onReady} className="block h-full w-full" aria-label="Arc Runner game" />
}
