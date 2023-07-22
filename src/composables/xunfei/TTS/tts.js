import { Base64 } from 'js-base64'
import TranscodeAudio from '../worker/transcode.worker?worker'
import { APP_ID, getWebsocketUrl } from '../index'

const transWorker = new TranscodeAudio()
// APPID，APISecret，APIKey在控制台-我的应用-语音合成（流式版）页面获取

class TTSRecorder {
  constructor({
                speed = 50,
                voice = 50,
                pitch = 50,
                voiceName = 'x4_lingxiaoying_em_v2',
                appId = APP_ID,
                text = '',
                tte = 'UTF8',
                defaultText = '请输入您要合成的文本',
              } = {}) {
    this.speed = speed
    this.voice = voice
    this.pitch = pitch
    this.voiceName = voiceName
    this.text = text
    this.tte = tte
    this.defaultText = defaultText
    this.appId = appId
    this.audioData = []
    this.rawAudioData = []
    this.audioDataOffset = 0
    this.status = 'init'
    transWorker.onmessage = (e) => {
      this.audioData.push(...e.data.data)
      this.rawAudioData.push(...e.data.rawAudioData)
    }
    this.onWillStatusChange = (oldStatus, status) => {}
    // new
    this.analyser = null
    this.sourceNode = null
    this.playing = false
  }

  // 修改录音听写状态
  setStatus(status) {
    this.onWillStatusChange && this.onWillStatusChange(this.status, status)
    this.status = status
  }

  // 设置合成相关参数
  setParams({ speed, voice, pitch, text, voiceName, tte }) {
    speed !== undefined && (this.speed = speed)
    voice !== undefined && (this.voice = voice)
    pitch !== undefined && (this.pitch = pitch)
    text && (this.text = text)
    tte && (this.tte = tte)
    voiceName && (this.voiceName = voiceName)
    this.resetAudio()
  }

  // 连接websocket
  connectWebSocket() {
    this.setStatus('ttsing')
    return getWebsocketUrl().then((url) => {
      console.log('url', url)
      let ttsWS
      if ('WebSocket' in window) {
        ttsWS = new WebSocket(url)
      }
      else if ('MozWebSocket' in window) {
        ttsWS = new MozWebSocket(url)
      }
      else {
        alert('浏览器不支持WebSocket')
        return
      }
      this.ttsWS = ttsWS
      ttsWS.onopen = (e) => {
        this.webSocketSend()
        this.playTimeout = setTimeout(() => {
          this.audioPlay()
        }, 1000)
      }
      ttsWS.onmessage = (e) => {
        this.result(e.data)
      }
      ttsWS.onerror = (e) => {
        clearTimeout(this.playTimeout)
        this.setStatus('errorTTS')
        alert('WebSocket报错，请f12查看详情')
        console.error(`详情查看：${encodeURI(url.replace('wss:', 'https:'))}`)
      }
      ttsWS.onclose = (e) => {
        console.log(e)
      }
    })
  }

  // 处理音频数据
  transToAudioData(audioData) {
  }

  // websocket发送数据
  webSocketSend() {
    const params = {
      common: {
        app_id: this.appId, // APPID
      },
      business: {
        aue: 'raw',
        auf: 'audio/L16;rate=16000',
        vcn: this.voiceName,
        speed: this.speed,
        volume: this.voice,
        pitch: this.pitch,
        bgs: 0,
        tte: this.tte,
      },
      data: {
        status: 2,
        text: this.encodeText(
          this.text || this.defaultText,
          this.tte === 'unicode' ? 'base64&utf16le' : '',
        ),
      },
    }
    this.ttsWS.send(JSON.stringify(params))
  }

  encodeText(text, encoding) {
    switch (encoding) {
      case 'utf16le' : {
        const buf = new ArrayBuffer(text.length * 4)
        const bufView = new Uint16Array(buf)
        for (let i = 0, strlen = text.length; i < strlen; i++)
          bufView[i] = text.charCodeAt(i)

        return buf
      }
      case 'buffer2Base64': {
        let binary = ''
        const bytes = new Uint8Array(text)
        const len = bytes.byteLength
        for (let i = 0; i < len; i++)
          binary += String.fromCharCode(bytes[i])

        return window.btoa(binary)
      }
      case 'base64&utf16le' : {
        return this.encodeText(this.encodeText(text, 'utf16le'), 'buffer2Base64')
      }
      default : {
        return Base64.encode(text)
      }
    }
  }

  // websocket接收数据的处理
  result(resultData) {
    const jsonData = JSON.parse(resultData)
    // console.log('resultData', jsonData)
    // 合成失败
    if (jsonData.code !== 0) {
      alert(`合成失败: ${jsonData.code}:${jsonData.message}`)
      console.error(`${jsonData.code}:${jsonData.message}`)
      this.resetAudio()
      return
    }
    transWorker.postMessage(jsonData.data.audio)
    // const audioData = jsonData.data.audio
    // this.transToAudioData(audioData)
    if (jsonData.code === 0 && jsonData.data.status === 2)
      this.ttsWS.close()
  }

  // 重置音频数据
  resetAudio() {
    console.log('我执行了')
    this.setStatus('init')
    this.audioStop()
    this.audioDataOffset = 0
    this.audioData = []
    this.rawAudioData = []
    this.ttsWS && this.ttsWS.close()
    clearTimeout(this.playTimeout)
  }

  // 音频初始化
  audioInit() {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (AudioContext) {
      this.audioContext = new AudioContext()
      this.audioContext.resume()
      this.audioDataOffset = 0
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048 // change to suit your application
    }
  }

  // 音频播放
  audioPlay() {
    this.setStatus('play')
    const audioData = this.audioData.slice(this.audioDataOffset)
    this.audioDataOffset += audioData.length
    if (audioData.length === 0)
      return

    const audioBuffer = this.audioContext.createBuffer(1, audioData.length, 22050)
    const nowBuffering = audioBuffer.getChannelData(0)
    if (audioBuffer.copyToChannel) {
      audioBuffer.copyToChannel(new Float32Array(audioData), 0, 0)
    }
    else {
      for (let i = 0; i < audioData.length; i++)
        nowBuffering[i] = audioData[i]
    }
    const bufferSource = this.bufferSource = this.audioContext.createBufferSource()

    // create a source node from audio buffer and connect it to analyzer and also to destination
    this.sourceNode = bufferSource
    this.sourceNode.buffer = audioBuffer
    this.sourceNode.connect(this.analyser)
    this.sourceNode.connect(this.audioContext.destination)

    // start playing
    this.sourceNode.start()

    this.sourceNode.onended = (event) => {
      console.log('播放结束')

      if (this.status !== 'play') {
        this.playing = false
        this.setStatus('endPlay')
        return
      }

      if (this.audioDataOffset < this.audioData.length) {
        this.audioPlay()
      }

      else {
        this.playing = false
        console.log('播放结束')
        this.setStatus('endPlay')
        this.audioStop()
      }
    }
  }

  getFrequencyData() {
    if (!this.analyser)
      return []

    const array = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(array)

    return array
  }

  // 音频播放结束
  audioStop() {
    this.setStatus('endPlay')
    clearTimeout(this.playTimeout)
    this.audioDataOffset = 0
    if (this.bufferSource) {
      console.log(this.bufferSource)
      try {
        this.bufferSource.stop()
      }
      catch (e) {
        console.log(e)
      }
    }
  }

  start() {
    if (this.audioData.length === 0 && this.text) {
      console.log('我执行了start===0')
      this.connectWebSocket().then(() => {
        this.audioInit()
      })
    }
    else if (this.audioData.length > 0) {
      console.log('我执行了start>0')
      this.audioPlay()
    }
  }

  stop() {
    console.log('我执行了stop')
    this.audioStop()
    this.resetAudio()
    this.audioInit()
  }

  setPlayStatus(status) {
    this.playing = status
  }

  getPlayStatus() { return this.playing }
}
export default TTSRecorder
