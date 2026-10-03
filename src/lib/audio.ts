export const requestMicrophone = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { micReady: false, reason: 'Microphone access is not available in this browser.' }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return { micReady: true, reason: 'Microphone is ready for the live audio path.' }
  } catch {
    return { micReady: false, reason: 'Microphone permission is off — demo audio is still running.' }
  }
}
