export class AudioPlayer {
  constructor() {
    this.fileUrl = 'https://media.oss.leziedu.com/webapp/duolaquan/22.mp3'
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    this.source = this.audioContext.createBufferSource()
    this.analyser = this.audioContext.createAnalyser()
    this.playing = false
  }

  loadAudio() {
    const request = new XMLHttpRequest()
    request.open('GET', this.fileUrl, true)
    request.responseType = 'arraybuffer'

    request.onload = () => {
      this.audioContext.decodeAudioData(request.response, (buffer) => {
        this.source.buffer = buffer
        // 将source连接到analyser，然后连接到destination
        this.source.connect(this.analyser)
        this.analyser.connect(this.audioContext.destination)
      }, (error) => {
        console.error('decodeAudioData error', error)
      })
    }

    request.onerror = () => {
      console.error('XHR error')
    }

    request.send()
  }

  play() {
    this.source.start(0)
  }

  setStatus(status) {
    this.playing = status
  }

  getStatus() { return this.playing }

  stop() {
    this.source.stop(0)
  }

  getFrequencyData() {
    // 创建一个Uint8Array来接收频率数据
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    // 将当前的频率数据复制到传入的Uint8Array中
    this.analyser.getByteFrequencyData(frequencyData)

    return frequencyData
  }
}
