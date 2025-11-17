
import React, { useEffect, useRef, useState } from 'react'

const PongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ballSpeedDisplay, setBallSpeedDisplay] = useState(3)

  // function ref so JSX button can call reset logic that's inside the effect
  const restartRef = useRef<(() => void) | null>(null)
  const gamePausedRef = useRef<boolean>(true)
  
  // UI state
  const [isGameOver, setIsGameOver] = useState(false)
  const [winnerText, setWinnerText] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Types
    interface Ball {
      x: number
      y: number
      radius: number
      velocityX: number
      velocityY: number
      speed: number // magnitude, used to compute velocity components
    }

    interface Player {
      x: number
      y: number
      width: number
      height: number
      velocityY: number
    }

    interface GameScore {
      player1: number
      player2: number
      timee: number
    }

    interface PongGameProps {
      winningScore: number
      paddleSpeed: number
      initialBallSpeed: number
      maxBallSpeed: number
      speedIncrement: number
    }

    const PongGameProps: PongGameProps = {
      winningScore: 7,
      paddleSpeed: 600,
      initialBallSpeed: 300,
      maxBallSpeed: 950,
      speedIncrement: 40,
    }

    // Game objects (mutables inside effect)
    const ball: Ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 10,
      velocityX: PongGameProps.initialBallSpeed * 0.6,
      velocityY: PongGameProps.initialBallSpeed * 0.2,
      speed: PongGameProps.initialBallSpeed,
    }

    const player1: Player = {
      x: 30,
      y: canvas.height / 2 - 45,
      width: 12,
      height: 90,
      velocityY: 0,
    }

    const player2: Player = {
      x: canvas.width - (30 + 12),
      y: canvas.height / 2 - 45,
      width: 12,
      height: 90,
      velocityY: 0,
    }

    const gameScore: GameScore = {
      player1: 0,
      player2: 0,
      timee: 0.0,
    }

    // pressed keys set -> persiste entre frames
    const pressed = new Set<string>()

    // draw helpers
    function drawBall(b: Ball) {
      if (!ctx) return
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    function drawPlayer(player: Player) {
      if (!ctx) return
      ctx.fillStyle = '#fff'
      ctx.fillRect(player.x, player.y, player.width, player.height)
    }

    function printScore() {
      if (!ctx || !canvas) return
      ctx.fillStyle = '#95dc32ff'
      ctx.font = '34px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${gameScore.player1}    ${gameScore.player2}`, canvas.width / 2 , 50)
    }

    function printMidelLine() {
      if (!ctx || !canvas) return
      ctx.fillStyle = '#ffffffaa'
      const lineWidth = 4
      const segmentHeight = 18
      for (let y = 3; y < canvas.height; y += segmentHeight * 2) {
        ctx.fillRect(canvas.width / 2 - lineWidth / 2, y, lineWidth, segmentHeight)
      }
    }

    function printPlayerSides() {
      if (!ctx || !canvas) return
      ctx.fillStyle = '#95dc32ff'
      ctx.font = '28px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Player 1', canvas.width / 4, 50)
      ctx.fillText('Player 2', (canvas.width / 4) * 3, 50)
    }

    function printTime() {
      if (!ctx || !canvas) return
      ctx.fillStyle = '#95dc32ff'
      ctx.font = '20px Arial'
      const totalSeconds = Math.floor(gameScore.timee)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      const timeString = `Time: ${minutes.toString().padStart(1, '0')}:${seconds.toString().padStart(2, '0')}`
      ctx.fillText(timeString, canvas.width / 2, canvas.height - 30)
    }

    function printGUI() {
      printPlayerSides()
      printMidelLine()
      printScore()
      printTime()
    }

    function setBallDirectionFromSpeed(directionSign: 1 | -1 = (Math.random() < 0.5 ? 1 : -1)) {
      const maxAngle = Math.PI / 4
      const angle = (Math.random() * maxAngle) - maxAngle / 2
      ball.velocityX = directionSign * ball.speed * Math.cos(angle)
      ball.velocityY = ball.speed * Math.sin(angle)
    }

    function resetBall(directionSign?: 1 | -1) {
      if (!canvas) return
      ball.x = canvas.width / 2
      ball.y = canvas.height / 2
      ball.speed = PongGameProps.initialBallSpeed
      setBallSpeedDisplay(ball.speed / 100) // affichage en "unités" lisibles (optionnel)
      const dir = directionSign ?? (Math.random() < 0.5 ? 1 : -1)
      setBallDirectionFromSpeed(dir)

      if (gamePausedRef.current) {
        // if game is paused, set velocities to 0
        ball.velocityX = 0
        ball.velocityY = 0
      }
      else {
        // otherwise serve normally
        setBallDirectionFromSpeed(dir)
      }
    }

    function resetPaddles() {
      if (!canvas) return
      player1.y = canvas.height / 2 - player1.height / 2
      player2.y = canvas.height / 2 - player2.height / 2
      player1.velocityY = 0
      player2.velocityY = 0
    }

    function checkCollisionWithPlayer(b: Ball, p: Player): boolean {
      return (
        b.x - b.radius < p.x + p.width &&
        b.x + b.radius > p.x &&
        b.y + b.radius > p.y &&
        b.y - b.radius < p.y + p.height
      )
    }

    // NOTE: velocities are px/s; update with dt (s)
    function updateBall(b: Ball, dt: number) {
      if (!canvas) return
      b.x += b.velocityX * dt
      b.y += b.velocityY * dt

      // top/bottom bounce
      if (b.y + b.radius > canvas.height) {
        b.y = canvas.height - b.radius
        b.velocityY = -b.velocityY
      } else if (b.y - b.radius < 0) {
        b.y = b.radius
        b.velocityY = -b.velocityY
      }

      // choose player side
      const player = b.x < canvas.width / 2 ? player1 : player2

      if (checkCollisionWithPlayer(b, player)) {
        const collidePoint = b.y - (player.y + player.height / 2)
        const normalizedCollidePoint = collidePoint / (player.height / 2)
        const angleRad = (Math.PI / 4) * normalizedCollidePoint
        const direction: 1 | -1 = player.x < canvas.width / 2 ? 1 : -1

        // set velocities from speed (magnitude)
        b.velocityX = direction * b.speed * Math.cos(angleRad)
        b.velocityY = b.speed * Math.sin(angleRad)

        // increment speed
        if (b.speed < PongGameProps.maxBallSpeed / 4 * 3) {
          b.speed = Math.min(PongGameProps.maxBallSpeed, b.speed + (PongGameProps.speedIncrement * 1.5))
          setBallSpeedDisplay(b.speed / 100)
        }
        else if (b.speed < PongGameProps.maxBallSpeed) {
          b.speed = Math.min(PongGameProps.maxBallSpeed, b.speed +PongGameProps.speedIncrement)
          setBallSpeedDisplay(b.speed / 100)
        }
        else {
          b.speed = PongGameProps.maxBallSpeed
          setBallSpeedDisplay(b.speed / 100)
        }

        // push ball out a bit
        if (player.x < canvas.width / 2) {
          b.x = player.x + player.width + b.radius + 0.1
        } else {
          b.x = player.x - b.radius - 0.1
        }
      }

      // scoring / reset if out
      if (b.x - b.radius < 0 || b.x + b.radius > canvas.width) {
        const lostOnLeft = b.x - b.radius < 0
        // update score BEFORE reset
        if (lostOnLeft) {
          gameScore.player2 += 1
        } else {
          gameScore.player1 += 1
        }
        // after updating score, we handle end game in the loop to centralize UI changes
        resetBall(lostOnLeft ? 1 : -1)
      }
    }

    function updatePlayer(player: Player, dt: number) {
      if (!canvas) return
      player.y += player.velocityY * dt
      if (player.y < 0) player.y = 0
      if (player.y + player.height > canvas.height) player.y = canvas.height - player.height
    }

    // keyboard handlers: update pressed set only
    function handleKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault()
        if (gamePausedRef.current) {
          if (ball.velocityX === 0 && ball.velocityY === 0) {
            setBallDirectionFromSpeed(Math.random() < 0.5 ? 1 : -1)
          }
          gamePausedRef.current = false;
        }
      }
      else if (e.code === 'Escape') {
        e.preventDefault()
        if (!gamePausedRef.current) {
          gamePausedRef.current = true;
          printPausedUI();
        }
      }
      const k = e.key
      const gameKeys = ['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown']
      if (gameKeys.includes(k)) {
        pressed.add(k)
        e.preventDefault()
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      const k = e.key
      if (pressed.has(k)) {
        pressed.delete(k)
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // initial reset
    resetBall()

    // main loop with dt, compute velocities each frame from pressed keys
    let lastTime = performance.now()
    let rafId = 0

    function computePlayerVelocitiesFromKeys() {
      // player 1: W / S
      const up1 = pressed.has('w') || pressed.has('W')
      const down1 = pressed.has('s') || pressed.has('S')
      const targetV1 = up1 ? -PongGameProps.paddleSpeed : down1 ? PongGameProps.paddleSpeed : 0
      player1.velocityY = targetV1

      // player 2: ArrowUp / ArrowDown
      const up2 = pressed.has('ArrowUp')
      const down2 = pressed.has('ArrowDown')
      const targetV2 = up2 ? -PongGameProps.paddleSpeed : down2 ? PongGameProps.paddleSpeed : 0
      player2.velocityY = targetV2
    }

    function checkEndGame(): boolean {
      return gameScore.player1 >= PongGameProps.winningScore || gameScore.player2 >= PongGameProps.winningScore
    }

    function drawOverlayAndWinner() {
      if (!ctx || !canvas) return
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // restart function that will be exposed via restartRef
    function restartGame() {
      // reset scores and ball/players
      gameScore.player1 = 0
      gameScore.player2 = 0
      gameScore.timee = 0.0
      gamePausedRef.current = true
      pressed.clear()
      resetBall()
      resetPaddles()
      setIsGameOver(false)
      setWinnerText('')
      // restart loop safely
      lastTime = performance.now()
      // ensure no duplicate RAFs
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(loop)
    }
    // expose
    restartRef.current = restartGame

    function  printPausedUI() {
      if (!ctx || !canvas) return
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drawPlayer(player1)
      drawPlayer(player2)
      drawBall(ball)
      printGUI()
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#95dc32ff'
      ctx.font = '48px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2)
    }

    function loop(now: number) {
      const dt = Math.min(0.05, (now - lastTime) / 1000) // clamp dt (s)
      lastTime = now

      if (gamePausedRef.current) {
        if (!ctx || !canvas) return
        printPausedUI();
        return rafId = requestAnimationFrame(loop)
      }

      // compute velocities from current pressed keys (handles simultaneous keys)
      computePlayerVelocitiesFromKeys()

      // update state with dt
      updatePlayer(player1, dt)
      updatePlayer(player2, dt)
      updateBall(ball, dt)
      gameScore.timee += dt

      // render
      if (!ctx || !canvas) return
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      drawPlayer(player1)
      drawPlayer(player2)
      drawBall(ball)
      printGUI()

      // check end game after drawing so we can update UI
      if (checkEndGame()) {
        // set UI state so React shows the Restart button overlay
        const winner = gameScore.player1 >= PongGameProps.winningScore ? 'Joueur 1 Gagne!' : 'Joueur 2 Gagne!'
        setWinnerText(winner)
        setIsGameOver(true)
        drawOverlayAndWinner()
        return
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      restartRef.current = null
    }

  }, [])

  // button handler calls function stored in restartRef (if present)
  function handleRestartClick() {
    restartRef.current?.()
  }

  return (
    <div className="pong-game" style={{ position: 'relative', width: 900 }}>
      <canvas ref={canvasRef} width={900} height={600} />
      {/* overlay UI button shown when game over */}
      {isGameOver && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ pointerEvents: 'auto', textAlign: 'center' }}>
            <div style={{ marginBottom: 19, color: '#95dc32ff', fontSize: 48, fontWeight: 'bold' }}>{winnerText}</div>
            <button onClick={handleRestartClick} style={{
              padding: '10px 18px',
              fontSize: 18,
              borderRadius: 6,
              cursor: 'pointer'
            }}>Restart</button>
          </div>
        </div>
      )}
      <div className="controls">
        <p>Speed: {ballSpeedDisplay.toFixed(1)}</p>
        <p><strong>Joueur 1:</strong> W (↑) / S (↓)</p>
        <p><strong>Joueur 2:</strong> Flèches ↑ / ↓</p>
      </div>
    </div>
  )
}

export default PongGame