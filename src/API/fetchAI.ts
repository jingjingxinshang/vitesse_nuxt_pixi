const token = 'app-NCWUgcInLiKKraSLUjuAMh0a'
export async function fetchAI(message: string) {
  const data = {
    inputs: {},
    query: message,
    response_mode: 'streaming',
    conversation_id: '',
    user: 'abc-123',
  }
  // conversation_id从返回值中取，第一次请求为空，后续请求带上
  const token = 'app-NCWUgcInLiKKraSLUjuAMh0a'
  try {
    const response = await fetch('/api/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    const message = ''
    if (response.status !== 200)
      throw new Error(`HTTP error! status: ${response.status}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const partialLine = ''
    while (true) {
      console.log(await reader.read())
      const { done, value } = await reader.read()
      console.log(value)
      let buffer = ''
      let bufferObj: any
      const isFirstMessage = true
      if (done) {
        console.log('Streaming response finished.')

        break
      }
      // const answer = value.answer
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      console.log(lines)
      lines.forEach((message) => {
        if (message.startsWith('data: ')) { // check if it starts with data:
          // console.log(message);
          try {
            bufferObj = JSON.parse(message.substring(6)) // remove data: and parse as json
          }
          catch (e) {
          }
        }
      })
      buffer = lines[lines.length - 1]
      console.log(buffer)
      // const decodedText = JSON.parse(text.replace('data: ', ''))
      // console.log(decodedText)
      // const chunk = partialLine + decodedText
      // const newLines = chunk.split(/\r?\n/)
      //
      // partialLine = newLines.pop() || ''
      //
      // for (const line of newLines) {
      //   if (line.length === 0)
      //     continue // ignore empty message
      //   if (line.startsWith(':'))
      //     continue // ignore sse comment message
      //   if (line === 'data: [DONE]')
      //     return
      //   //
      //
      //   const json = JSON.parse(line.substring(6)) // start with "data: "
      //   console.log(json)
      //   message += json.answer
      // }
    }
    return message
  }
  catch (error) {
    console.error('Error fetching streaming response:', error)
  }
  finally {
  }
}
const reqData = {
  inputs: {},
  query: '',
  response_mode: 'blocking',
  conversation_id: '',
  user: 'abc-123',
}
export async function fetchAIBlocking(message: string) {
  try {
    reqData.query = message
    reqData.response_mode = 'blocking'
    const response = await fetch('/api/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reqData),
    })
    const data = await response.json()
    console.log(data)
    reqData.conversation_id = data.conversation_id
    return data
  }
  catch (e) {
    console.log(e)
  }
  finally {
  }
}
