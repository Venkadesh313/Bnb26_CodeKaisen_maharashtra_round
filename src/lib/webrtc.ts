import type { RoomSocket } from './socket'

export type WebRtcSignal =
  | { type: 'offer' | 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'candidate'; candidate: RTCIceCandidateInit }

export type WebRtcPeer = { id: string }

type WebRtcCallbacks = {
  onStatus: (status: 'idle' | 'ready' | 'connecting' | 'connected' | 'error') => void
  onRemoteStream?: (peerId: string, stream: MediaStream) => void
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export class WebRtcMesh {
  private readonly socket: RoomSocket
  private readonly callbacks: WebRtcCallbacks
  private readonly peers = new Map<string, RTCPeerConnection>()
  private readonly remoteAudios = new Map<string, HTMLAudioElement>()
  private localStream: MediaStream | null = null

  constructor(socket: RoomSocket, callbacks: WebRtcCallbacks) {
    this.socket = socket
    this.callbacks = callbacks
    socket.on('webrtc:peers', (participants) => {
      participants.forEach((participant) => {
        if (participant.id !== socket.id) void this.createOffer(participant.id)
      })
    })
    socket.on('webrtc:signal', ({ from, signal }) => void this.handleSignal(from, signal))
    socket.on('webrtc:peer-left', ({ peerId }) => this.removePeer(peerId))
  }

  setLocalStream(stream: MediaStream) {
    this.localStream = stream
    this.peers.forEach((peer, peerId) => {
      stream.getTracks().forEach((track) => {
        if (!peer.getSenders().some((sender) => sender.track?.id === track.id)) peer.addTrack(track, stream)
      })
      void this.renegotiate(peerId, peer)
    })
    this.callbacks.onStatus('ready')
  }

  close() {
    this.peers.forEach((peer) => peer.close())
    this.peers.clear()
    this.remoteAudios.forEach((audio) => audio.remove())
    this.remoteAudios.clear()
    this.localStream?.getTracks().forEach((track) => track.stop())
    this.localStream = null
    this.callbacks.onStatus('idle')
  }

  private createPeer(peerId: string) {
    const existing = this.peers.get(peerId)
    if (existing) return existing
    const peer = new RTCPeerConnection(RTC_CONFIG)
    this.peers.set(peerId, peer)
    this.localStream?.getTracks().forEach((track) => peer.addTrack(track, this.localStream as MediaStream))
    peer.onicecandidate = (event) => {
      if (event.candidate) this.socket.emit('webrtc:signal', { to: peerId, signal: { type: 'candidate', candidate: event.candidate.toJSON() } })
    }
    peer.ontrack = (event) => {
      const [stream] = event.streams
      if (!stream) return
      this.callbacks.onRemoteStream?.(peerId, stream)
      let audio = this.remoteAudios.get(peerId)
      if (!audio) {
        audio = document.createElement('audio')
        audio.autoplay = true
        audio.setAttribute('aria-hidden', 'true')
        audio.dataset.peerId = peerId
        document.body.appendChild(audio)
        this.remoteAudios.set(peerId, audio)
      }
      audio.srcObject = stream
    }
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') this.callbacks.onStatus('connected')
      if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') this.removePeer(peerId)
    }
    return peer
  }

  private async createOffer(peerId: string) {
    const peer = this.createPeer(peerId)
    this.callbacks.onStatus('connecting')
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    this.socket.emit('webrtc:signal', { to: peerId, signal: { type: 'offer', sdp: offer } })
  }

  private async renegotiate(peerId: string, peer: RTCPeerConnection) {
    if (peer.signalingState !== 'stable') return
    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)
    this.socket.emit('webrtc:signal', { to: peerId, signal: { type: 'offer', sdp: offer } })
  }

  private async handleSignal(peerId: string, signal: WebRtcSignal) {
    try {
      const peer = this.createPeer(peerId)
      if (signal.type === 'candidate') {
        await peer.addIceCandidate(signal.candidate)
        return
      }
      await peer.setRemoteDescription(signal.sdp)
      if (signal.type === 'offer') {
        this.callbacks.onStatus('connecting')
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        this.socket.emit('webrtc:signal', { to: peerId, signal: { type: 'answer', sdp: answer } })
      }
    } catch {
      this.callbacks.onStatus('error')
    }
  }

  private removePeer(peerId: string) {
    this.peers.get(peerId)?.close()
    this.peers.delete(peerId)
    this.remoteAudios.get(peerId)?.remove()
    this.remoteAudios.delete(peerId)
    if (!this.peers.size) this.callbacks.onStatus(this.localStream ? 'ready' : 'idle')
  }
}
