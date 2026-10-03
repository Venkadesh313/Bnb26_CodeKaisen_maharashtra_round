export type MicrophoneResult = {
  micReady: boolean
  reason: string
  stream?: MediaStream
}

export const requestMicrophone = async (): Promise<MicrophoneResult> => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { micReady: false, reason: 'Microphone access is not available in this browser.' }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    return { micReady: true, reason: 'Microphone is ready for the live audio path.', stream }
  } catch {
    return { micReady: false, reason: 'Microphone permission is off — demo audio is still running.' }
  }
}
