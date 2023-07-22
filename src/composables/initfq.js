import { getByteFrequencyData } from '~/composables/frequency'

const canvas = document.getElementById('canvas')
canvas.width = 1200
canvas.height = 400
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#000'

const w = 20
const o = 80
export function run() {
  const frequencyData = getByteFrequencyData()
  ctx.clearRect(0, 0, 1200, 400)
  for (let i = 0; i < 1200; i += o) {
    const h = frequencyData[i]
    ctx.fillRect(
      (i / o) * w,
      0,
      w,
      h * 2,
    )
  }

  setTimeout(run, 1000 / 30)
}
