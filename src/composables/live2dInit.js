import * as PIXI from 'pixi.js'
import { InternalModel, Live2DModel, MotionPreloadStrategy } from 'pixi-live2d-display'

// if (process.browser) {
window.PIXI = PIXI
export const live2dModelUrl = [
  '../../src/assets/paimeng/paimeng.model3.json',
  '../../src/assets/rena/rena.model3.json',
  '../../src/assets/model/MissBai.model3.json',
  '../../src/assets/model2/HK416_805/normal.model3.json',
]
async function init(url) {
  try {
    const model = await Live2DModel.from(url || '../../src/assets/paimeng/paimeng.model3.json', { motionPreload: MotionPreloadStrategy.NONE })
    // const model = await Live2DModel.from('../../src/assets/rena/rena.model3.json', { motionPreload: MotionPreloadStrategy.NONE })
    // const model = await Live2DModel.from('../../src/assets/model/MissBai.model3.json', { motionPreload: MotionPreloadStrategy.NONE })
    // const model = await Live2DModel.from('../../src/assets/model2/HK416_805/normal.model3.json', { motionPreload: MotionPreloadStrategy.NONE })
    // const model = await Live2DModel.from('../../src/assets/shizuku/shizuku.model.json', { motionPreload: MotionPreloadStrategy.NONE })
    const app = new PIXI.Application({
      view: document.getElementById('canvas_view'),
      transparent: true,
      autoDensity: true,
      autoResize: true,
      antialias: true,
      height: '900',
      width: 600,
    })

    model.trackedPointers = [{ id: 1, type: 'pointerdown', flags: true }, { id: 2, type: 'mousemove', flags: true }]
    app.stage.addChild(model)
    model.scale.set(0.2)
    model.x = 20
    const a = new InternalModel(model)
    model.InternalModel = a

    model.on('pointerdown', (hitAreas) => {
      const { x, y } = hitAreas.data.global
      const point = model.hitTest(x, y)
      model.motion('Tap')
    })

    draggable(model)
    addFrame(model)

    return model
  }
  catch (error) {
    console.error('Failed to initialize the model:', error)
  }
}

function draggable(model) {
  // ... same as before ...
  model.buttonMode = true
  model.on('pointerdown', (e) => {
    model.dragging = true
    model._pointerX = e.data.global.x - model.x
    model._pointerY = e.data.global.y - model.y
  })
  model.on('pointermove', (e) => {
    if (model.dragging) {
      model.position.x = e.data.global.x - model._pointerX
      model.position.y = e.data.global.y - model._pointerY
    }
  })
  model.on('pointerupoutside', () => (model.dragging = false))
  model.on('pointerup', () => (model.dragging = false))
}

function addFrame(model) {
  // ... same as before ...
  const foreground = PIXI.Sprite.from(PIXI.Texture.WHITE)
  foreground.width = model.internalModel.width
  foreground.height = model.internalModel.height
  foreground.alpha = 0.2

  model.addChild(foreground)
  foreground.visible = true
}

export { init }
