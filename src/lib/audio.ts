export type MicrophoneResult = {
  micReady: boolean
  reason: string
  stream?: MediaStream
}

export type CameraResult = {
  cameraReady: boolean
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

export const requestCamera = async (): Promise<CameraResult> => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { cameraReady: false, reason: 'Camera access is not available in this browser.' }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false,
    })
    return { cameraReady: true, reason: 'Camera is ready for the meeting.', stream }
  } catch {
    return { cameraReady: false, reason: 'Camera permission is off — your avatar will stay visible.' }
  }
}
