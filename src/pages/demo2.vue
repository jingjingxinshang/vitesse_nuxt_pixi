<script setup lang="ts">
import { onMounted } from 'vue'
import { NButton, NEmpty, NInput } from 'naive-ui'
import { fetchAIBlocking } from '~/API/fetchAI'
import { init, live2dModelUrl } from '~/composables/live2dInit'
import TTSRecorder from '~/composables/xunfei/TTS/tts'

const TTS = ref(new TTSRecorder())
const model = ref()
const userText = ref('')
const inputInstRef = ref()
interface contentType {
  id: number
  content: string
  time: string
  role: 'user' | 'assistant'
}
const contentArray = ref<contentType[]>([
  {
    id: 1,
    content: '测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC测试ABC',
    time: new Date().toTimeString(),
    role: 'user',
  }, {
    id: 2,
    content: '正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中正在思考中',
    time: new Date().toTimeString(),
    role: 'assistant',
  },
])
onMounted(async () => {
  await init().then((res) => {
    model.value = res
  })
})
const status = ref('init')
function TTSPlay(message): void {
  TTS.value.setParams({
    text: message || userText.value,
  } as any)
  if (['init', 'endPlay', 'errorTTS', 'ttsing'].includes(status.value)) {
    TTS.value.start()
  }
  else {
    TTS.value.stop()
    status.value = 'init'
  }
  // 根据tts合成结果的波频 设置口口型
  TTS.value.onWillStatusChange = (oldStatus, statu) => {
    console.log('onWillStatusChange', oldStatus, statu)
    status.value = statu
    if (statu === 'play') {
      TTS.value.setPlayStatus(true)
      const arrayAdd = (a: number[]) => a.reduce((i, a) => i + a, 0)
      const o = 1
      const run = () => {
        if (TTS.value.getPlayStatus() === false)
          return
        const frequencyData = TTS.value.getFrequencyData()
        const arr = []
        for (let i = 0; i < 700; i += o)
          arr.push(frequencyData[i])
        setMouthOpenY((arrayAdd(arr) / arr.length - 20) / 100)
        setTimeout(run, 10)
      }
      run()
    }
  }
}
function setMouthOpenY(v) {
  v = Math.max(0, Math.min(1, v))
  model.value.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', v)
}
async function fetchMessage() {
  try {
    contentArray.value.push({
      id: contentArray.value.length > 0 ? contentArray.value[contentArray.value.length - 1]?.id + 1 : 1,
      content: userText.value,
      time: new Date().toTimeString(),
      role: 'user',
    })
    contentArray.value.push({
      id: contentArray.value[contentArray.value.length - 1].id + 1,
      content: '正在思考中',
      time: new Date().toTimeString(),
      role: 'assistant',
    })
    const res = await fetchAIBlocking(userText.value)
    contentArray.value[contentArray.value.length - 1].content = res.answer
    userText.value = ''
    TTSPlay(res.answer)
  }
  catch (e) {
    console.log(e)
  }
}
function focusInput() {
  inputInstRef.value?.focus()
}
function keydownfn(e) {
  const oEvent = e || event
  if (oEvent.shiftKey && oEvent.keyCode === 13)
    console.log('换行')

  if (oEvent.shiftKey === false && oEvent.keyCode === 13) {
    console.log('发送')
    fetchMessage()
  }
}
async function live2dChange(align: string) {
  console.log(align)

  // 根据align切换模型
  const index = live2dModelUrl.indexOf(model.value.modelUrl)
  if (align === 'left') {
    if (index === 0) {
      await init(live2dModelUrl[live2dModelUrl.length - 1]).then((res) => {
        model.value = res
      })
    }
    else {
      await init(live2dModelUrl[live2dModelUrl.length - 1]).then((res) => {
        model.value = res
      })
    }
  }
  else {
    if (index === live2dModelUrl.length - 1) {
      await init(live2dModelUrl[0]).then((res) => {
        model.value = res
      })
    }
    else {
      await init(live2dModelUrl[index + 1]).then((res) => {
        model.value = res
      })
    }
  }
}
</script>

<template>
  <div flex-col bg-gray-100>
    <div flex items-center class="h-12 flex shrink-0 items-center justify-center bg-gray-100 px-3">
      <div style="background: #ccfbf1;border-radius: 10px">
        <img src="../assets/images/robot.png" alt="">
      </div>
      <div ml1 text-sm font-bold text-gray-800>
        集训营Chat
      </div>
    </div>
    <div h-700px w-full flex class="rd-2 bg-white" overflow-hidden>
      <div flex>
        <div i-carbon-arrow-left @click="live2dChange('left')" />
        <canvas id="canvas_view" />
        <div i-carbon-arrow-right @click="live2dChange('right')" />
      </div>
      <div style="border-left: 1px solid rgb(224, 224, 230)" flex-1 px3>
        <div h-full flex>
          <div v-if="contentArray.length === 0" w-full flex items-center justify-center>
            <NEmpty description="输入内容开始聊天">
              <template #extra>
                <NButton size="small" @click="focusInput">
                  开始聊天吧
                </NButton>
              </template>
            </NEmpty>
          </div>
          <div v-else w-full style="overflow-y: auto">
            <div v-for="(item, index) in contentArray" :key="index">
              <div v-if="item.role === 'assistant'" mt5 flex justify-start>
                <div class="message_icon">
                  <img h10 w10 src="../assets/images/robot.png">
                </div>
                <div class="message_content con_assistant">
                  {{ item.content }}
                </div>
              </div>
              <div v-if="item.role === 'user'" mt5 flex justify-end>
                <div class="message_content con_user">
                  {{ item.content }}
                </div>
                <div class="message_icon">
                  <img h10 w10 rd-100 src="../assets/images/user.jpg">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div flex bg-white px20px>
      <NInput
        ref="inputInstRef" v-model:value="userText" type="textarea"
        placeholder="请输入内容"
        maxlength="2000" show-count autosize mt-20px class="justify-start text-start"
      />
      <NButton
        ml2 type="primary" mt-20px class="color-black" @click="fetchMessage"
      >
        发送
      </NButton>
    </div>
    <div />
  </div>
</template>

<style  scoped>
.message_content{
  max-width: 80%;
  border-radius: 16px;
  word-break: break-all;
  position: relative;
  text-align: left;
}
.message_content:before{
  content: "";
  position: absolute;
  top: 0;
  width: 8px;
  height: 12px;
}
.con_assistant{
  padding: 16px 12px;
  background: #f3f4f6;
  border-top-left-radius: 0 !important;
  margin-left: 10px;
}
.con_assistant:before{
  left: -8px;
  background: url("../assets/images/answer.png");
}
.con_user{
  padding: 12px 16px;
  background: #e1effe;
  border-top-right-radius: 0 !important;
  margin-right: 10px;
}
.con_user:before{
  right: -8px;
  background: url("../assets/images/question.png");
}
</style>
