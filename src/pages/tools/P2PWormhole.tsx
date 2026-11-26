import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import jsQR from 'jsqr'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Camera,
  Check,
  Copy,
  Download,
  File as FileIcon,
  Link2,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Unplug,
  Upload,
  Wifi,
  X,
} from 'lucide-react'
import Peer, { type DataConnection } from 'peerjs'
import { useSearchParams } from 'react-router'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import {
  WORMHOLE_CHUNK_BYTES,
  WORMHOLE_CODE_LENGTH,
  buildWormholeShareUrl,
  detectFriendlyDeviceLabel,
  extractRoomCodeFromInput,
  formatTransferSpeed,
  generateWormholeCode,
  normalizeWormholeCode,
  renderWormholeQrDataUrl,
  roomCodeToPeerId,
  type WormholePacket,
  type WormholeTransferItem,
} from '../../lib/p2pWormhole'
import { consumePendingSmartFile } from '../../lib/smartFileStore'
import { downloadBlob } from '../../utils/download'
import { formatFileSize } from '../../utils/file'

type ConnectionState =
  | 'initializing'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'error'

interface IncomingFileAccumulator {
  fileId: string
  name: string
  size: number
  mimeType: string
  totalChunks: number
  chunks: Uint8Array[]
  receivedBytes: number
  startedAt: number
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

export default function P2PWormhole() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialJoinRoom = useMemo(() => {
    const raw = searchParams.get('room')
    if (!raw) return null
    const clean = normalizeWormholeCode(raw)
    return clean.length === WORMHOLE_CODE_LENGTH ? clean : null
  }, [searchParams])

  const [myRoomCode, setMyRoomCode] = useState<string>(() =>
    generateWormholeCode(),
  )
  const [joinCodeInput, setJoinCodeInput] = useState<string>(
    () => initialJoinRoom ?? '',
  )
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [connState, setConnState] = useState<ConnectionState>('initializing')
  const [remoteDeviceLabel, setRemoteDeviceLabel] = useState<string>('')
  const [statusError, setStatusError] = useState<string | null>(null)

  const [transfers, setTransfers] = useState<WormholeTransferItem[]>([])
  const [textDraft, setTextDraft] = useState<string>('')
  const [autoDownloadFiles, setAutoDownloadFiles] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // In-app camera QR scanner state
  const [isScanningQr, setIsScanningQr] = useState<boolean>(false)

  // Refs
  const peerRef = useRef<Peer | null>(null)
  const activeConnRef = useRef<DataConnection | null>(null)
  const incomingFilesRef = useRef<Map<string, IncomingFileAccumulator>>(
    new Map(),
  )
  const autoDownloadRef = useRef<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingQueuedFileRef = useRef<File | null>(null)
  const didAutoJoinUrlRef = useRef<boolean>(false)

  // Camera scanner refs
  const scanVideoRef = useRef<HTMLVideoElement | null>(null)
  const scanStreamRef = useRef<MediaStream | null>(null)
  const scanRafRef = useRef<number | null>(null)

  const myDeviceLabel = useMemo(() => detectFriendlyDeviceLabel(), [])
  const shareUrl = useMemo(
    () => buildWormholeShareUrl(myRoomCode),
    [myRoomCode],
  )
  const formattedRoomDisplay = useMemo(
    () => `${myRoomCode.slice(0, 3)}-${myRoomCode.slice(3)}`,
    [myRoomCode],
  )

  useEffect(() => {
    autoDownloadRef.current = autoDownloadFiles
  }, [autoDownloadFiles])

  // Render scannable QR whenever myRoomCode changes
  useEffect(() => {
    let cancelled = false
    void renderWormholeQrDataUrl(shareUrl).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [shareUrl])

  // Capture smart file from Homepage dropzone so user can send immediately once paired
  useEffect(() => {
    const smart = consumePendingSmartFile()
    if (smart) {
      pendingQueuedFileRef.current = smart
    }
  }, [])

  const stopQrScanner = useCallback(() => {
    if (scanRafRef.current !== null) {
      cancelAnimationFrame(scanRafRef.current)
      scanRafRef.current = null
    }
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach((tr) => tr.stop())
      scanStreamRef.current = null
    }
    setIsScanningQr(false)
  }, [])

  const handleIncomingPacket = useCallback((raw: unknown) => {
    if (!raw || typeof raw !== 'object' || !('kind' in raw)) return
    const pkt = raw as WormholePacket

    if (pkt.kind === 'hello') {
      setRemoteDeviceLabel(pkt.deviceLabel || 'Remote Peer')
      return
    }

    if (pkt.kind === 'text') {
      const item: WormholeTransferItem = {
        id: pkt.id,
        direction: 'received',
        kind: 'text',
        name: t('Teks / Tautan Masuk', 'Incoming Text / Link'),
        size: new Blob([pkt.text]).size,
        mimeType: 'text/plain',
        progress: 100,
        speedBps: 0,
        status: 'completed',
        textValue: pkt.text,
        timestamp: pkt.sentAt || Date.now(),
      }
      setTransfers((prev) => [item, ...prev])
      return
    }

    if (pkt.kind === 'file-start') {
      incomingFilesRef.current.set(pkt.fileId, {
        fileId: pkt.fileId,
        name: pkt.name,
        size: pkt.size,
        mimeType: pkt.mimeType || 'application/octet-stream',
        totalChunks: Math.max(1, pkt.totalChunks),
        chunks: [],
        receivedBytes: 0,
        startedAt: performance.now(),
      })

      const placeholder: WormholeTransferItem = {
        id: pkt.fileId,
        direction: 'received',
        kind: 'file',
        name: pkt.name,
        size: pkt.size,
        mimeType: pkt.mimeType || 'application/octet-stream',
        progress: 0,
        speedBps: 0,
        status: 'transferring',
        timestamp: Date.now(),
      }
      setTransfers((prev) => [placeholder, ...prev])
      return
    }

    if (pkt.kind === 'file-chunk') {
      const entry = incomingFilesRef.current.get(pkt.fileId)
      if (!entry) return

      const bytes =
        pkt.data instanceof Uint8Array
          ? pkt.data
          : new Uint8Array(pkt.data)

      entry.chunks[pkt.index] = bytes
      entry.receivedBytes += bytes.byteLength

      const elapsedSec = Math.max(
        0.05,
        (performance.now() - entry.startedAt) / 1000,
      )
      const speedBps = entry.receivedBytes / elapsedSec
      const pct =
        entry.size > 0
          ? Math.min(99, Math.round((entry.receivedBytes / entry.size) * 100))
          : 99

      setTransfers((prev) =>
        prev.map((tr) =>
          tr.id === pkt.fileId
            ? { ...tr, progress: pct, speedBps }
            : tr,
        ),
      )
      return
    }

    if (pkt.kind === 'file-end') {
      const entry = incomingFilesRef.current.get(pkt.fileId)
      if (!entry) return
      incomingFilesRef.current.delete(pkt.fileId)

      const orderedParts: BlobPart[] = []
      for (let i = 0; i < entry.chunks.length; i++) {
        if (entry.chunks[i]) {
          orderedParts.push(entry.chunks[i] as BlobPart)
        }
      }
      const assembled = new Blob(orderedParts, { type: entry.mimeType })
      const elapsedSec = Math.max(
        0.05,
        (performance.now() - entry.startedAt) / 1000,
      )
      const finalSpeed = assembled.size / elapsedSec

      setTransfers((prev) =>
        prev.map((tr) =>
          tr.id === pkt.fileId
            ? {
                ...tr,
                progress: 100,
                speedBps: finalSpeed,
                status: 'completed',
                blob: assembled,
              }
            : tr,
        ),
      )

      if (autoDownloadRef.current) {
        downloadBlob(assembled, entry.name)
      }
    }
  }, [t])

  const sendSingleFileOverConn = useCallback(
    async (file: File, conn: DataConnection) => {
      const fileId = `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const totalChunks = Math.max(
        1,
        Math.ceil(file.size / WORMHOLE_CHUNK_BYTES),
      )

      const transferRow: WormholeTransferItem = {
        id: fileId,
        direction: 'sent',
        kind: 'file',
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        progress: 0,
        speedBps: 0,
        status: 'transferring',
        blob: file,
        timestamp: Date.now(),
      }
      setTransfers((prev) => [transferRow, ...prev])

      const startPacket: WormholePacket = {
        kind: 'file-start',
        fileId,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        totalChunks,
      }
      conn.send(startPacket)

      const startedAt = performance.now()
      let sentBytes = 0

      try {
        for (let idx = 0; idx < totalChunks; idx++) {
          const sliceStart = idx * WORMHOLE_CHUNK_BYTES
          const sliceEnd = Math.min(
            file.size,
            sliceStart + WORMHOLE_CHUNK_BYTES,
          )
          const buffer = await file.slice(sliceStart, sliceEnd).arrayBuffer()

          // Respect WebRTC SCTP buffer backpressure for smooth multi-100MB transfers
          const dc = conn.dataChannel as RTCDataChannel | undefined
          if (dc && dc.bufferedAmount > 2 * 1024 * 1024) {
            await new Promise<void>((resolve) => {
              const checkDrain = () => {
                if (!dc || dc.readyState !== 'open' || dc.bufferedAmount < 512 * 1024) {
                  resolve()
                } else {
                  window.setTimeout(checkDrain, 25)
                }
              }
              checkDrain()
            })
          }

          const chunkPacket: WormholePacket = {
            kind: 'file-chunk',
            fileId,
            index: idx,
            data: buffer,
          }
          conn.send(chunkPacket)

          sentBytes += buffer.byteLength
          const elapsedSec = Math.max(
            0.05,
            (performance.now() - startedAt) / 1000,
          )
          const speedBps = sentBytes / elapsedSec
          const pct =
            file.size > 0
              ? Math.min(99, Math.round((sentBytes / file.size) * 100))
              : 99

          if (idx % 6 === 0 || idx === totalChunks - 1) {
            setTransfers((prev) =>
              prev.map((tr) =>
                tr.id === fileId
                  ? { ...tr, progress: pct, speedBps }
                  : tr,
              ),
            )
          }
        }

        const endPacket: WormholePacket = {
          kind: 'file-end',
          fileId,
        }
        conn.send(endPacket)

        const totalSec = Math.max(
          0.05,
          (performance.now() - startedAt) / 1000,
        )
        setTransfers((prev) =>
          prev.map((tr) =>
            tr.id === fileId
              ? {
                  ...tr,
                  progress: 100,
                  speedBps: file.size / totalSec,
                  status: 'completed',
                }
              : tr,
          ),
        )
      } catch {
        setTransfers((prev) =>
          prev.map((tr) =>
            tr.id === fileId ? { ...tr, status: 'error' } : tr,
          ),
        )
      }
    },
    [],
  )

  const bindDataConnection = useCallback(
    (conn: DataConnection) => {
      if (activeConnRef.current && activeConnRef.current !== conn) {
        try {
          activeConnRef.current.close()
        } catch {
          // Ignore close error
        }
      }

      activeConnRef.current = conn
      setStatusError(null)
      setConnState('connecting')

      conn.on('open', () => {
        setConnState('connected')
        const hello: WormholePacket = {
          kind: 'hello',
          deviceLabel: myDeviceLabel,
        }
        conn.send(hello)

        if (pendingQueuedFileRef.current) {
          const queued = pendingQueuedFileRef.current
          pendingQueuedFileRef.current = null
          void sendSingleFileOverConn(queued, conn)
        }
      })

      conn.on('data', (data) => {
        handleIncomingPacket(data)
      })

      conn.on('close', () => {
        if (activeConnRef.current === conn) {
          activeConnRef.current = null
          setRemoteDeviceLabel('')
          setConnState('waiting')
        }
      })

      conn.on('error', (err) => {
        setStatusError(err.message || 'WebRTC DataChannel error.')
        setConnState('waiting')
      })
    },
    [handleIncomingPacket, myDeviceLabel, sendSingleFileOverConn],
  )

  const connectToRemoteRoom = useCallback(
    (targetCode: string) => {
      const peer = peerRef.current
      const clean = normalizeWormholeCode(targetCode)
      if (!peer || clean.length !== WORMHOLE_CODE_LENGTH) return

      if (clean === myRoomCode) {
        setStatusError(
          t(
            'Kode tersebut adalah ruangan perangkat ini sendiri. Masukkan kode dari perangkat lawan.',
            'That is this device’s own room code. Enter the code shown on your other device.',
          ),
        )
        return
      }

      setStatusError(null)
      setConnState('connecting')
      const conn = peer.connect(roomCodeToPeerId(clean), {
        reliable: true,
      })
      bindDataConnection(conn)
    },
    [bindDataConnection, myRoomCode, t],
  )

  // Initialize local PeerJS node for myRoomCode
  useEffect(() => {
    const peer = new Peer(roomCodeToPeerId(myRoomCode), {
      config: { iceServers: ICE_SERVERS },
    })
    peerRef.current = peer

    peer.on('open', () => {
      setConnState((prev) => (prev === 'connected' ? 'connected' : 'waiting'))
      if (initialJoinRoom && !didAutoJoinUrlRef.current) {
        didAutoJoinUrlRef.current = true
        connectToRemoteRoom(initialJoinRoom)
      }
    })

    peer.on('connection', (incomingConn) => {
      bindDataConnection(incomingConn)
    })

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        setMyRoomCode(generateWormholeCode())
        return
      }
      if (err.type === 'peer-unavailable') {
        setConnState('waiting')
        setStatusError(
          t(
            'Perangkat dengan kode tersebut tidak ditemukan atau sudah menutup halaman.',
            'No active device found for that room code. Check that the other screen is open.',
          ),
        )
        return
      }
      setConnState('error')
      setStatusError(err.message)
    })

    return () => {
      stopQrScanner()
      try {
        peer.destroy()
      } catch {
        // Ignore cleanup errors
      }
      peerRef.current = null
      activeConnRef.current = null
    }
  }, [
    myRoomCode,
    initialJoinRoom,
    bindDataConnection,
    connectToRemoteRoom,
    stopQrScanner,
    t,
  ])

  async function handleStartQrScanner() {
    if (isScanningQr) {
      stopQrScanner()
      return
    }

    setStatusError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      scanStreamRef.current = stream
      setIsScanningQr(true)

      const pollFrame = () => {
        const video = scanVideoRef.current
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const qr = jsQR(imgData.data, imgData.width, imgData.height)
            if (qr?.data) {
              const extracted = extractRoomCodeFromInput(qr.data)
              if (extracted) {
                stopQrScanner()
                setJoinCodeInput(extracted)
                connectToRemoteRoom(extracted)
                return
              }
            }
          }
        }
        scanRafRef.current = requestAnimationFrame(pollFrame)
      }

      scanRafRef.current = requestAnimationFrame(pollFrame)
    } catch {
      stopQrScanner()
      setStatusError(
        t(
          'Tidak dapat membuka kamera untuk scan QR. Anda tetap bisa mengetik kode 6 digit secara manual.',
          'Unable to access camera for QR scan. You can still type the 6-digit code manually.',
        ),
      )
    }
  }

  function handleDisconnectPeer() {
    if (activeConnRef.current) {
      activeConnRef.current.close()
      activeConnRef.current = null
    }
    setRemoteDeviceLabel('')
    setConnState('waiting')
    if (searchParams.has('room')) {
      setSearchParams({}, { replace: true })
    }
  }

  function handleRegenerateRoom() {
    handleDisconnectPeer()
    setStatusError(null)
    setConnState('initializing')
    setMyRoomCode(generateWormholeCode())
  }

  async function handleFilesSelected(fileList: FileList | File[]) {
    const conn = activeConnRef.current
    if (!conn || connState !== 'connected') return
    const arr = Array.from(fileList)
    for (const file of arr) {
      await sendSingleFileOverConn(file, conn)
    }
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      void handleFilesSelected(files)
    }
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFilesSelected(e.dataTransfer.files)
    }
  }

  function handleSendText() {
    const conn = activeConnRef.current
    const clean = textDraft.trim()
    if (!conn || connState !== 'connected' || !clean) return

    const id = `txt-${Date.now()}`
    const pkt: WormholePacket = {
      kind: 'text',
      id,
      text: clean,
      sentAt: Date.now(),
    }
    conn.send(pkt)

    const localEntry: WormholeTransferItem = {
      id,
      direction: 'sent',
      kind: 'text',
      name: t('Teks / Tautan Terkirim', 'Sent Text / Link'),
      size: new Blob([clean]).size,
      mimeType: 'text/plain',
      progress: 100,
      speedBps: 0,
      status: 'completed',
      textValue: clean,
      timestamp: Date.now(),
    }
    setTransfers((prev) => [localEntry, ...prev])
    setTextDraft('')
  }

  async function handleCopyString(key: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopiedId(key)
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === key ? null : prev))
    }, 1800)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="p2p-wormhole" />

      <input
        id="wormhole-file-input"
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Top Live Connection Banner */}
      <div className="ios-card mt-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              connState === 'connected'
                ? 'bg-[var(--success)]/15 text-[var(--success)]'
                : connState === 'connecting' || connState === 'initializing'
                  ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                  : 'bg-[var(--surface-soft)] text-[var(--text-secondary)]'
            }`}
          >
            {connState === 'connecting' || connState === 'initializing' ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Wifi size={18} />
            )}
          </span>

          <div>
            <p className="text-xs font-bold text-[var(--text-primary)] sm:text-sm">
              {connState === 'connected'
                ? t(
                    `Terhubung P2P Langsung ke ${remoteDeviceLabel || 'Perangkat Lawan'}`,
                    `Connected P2P Directly to ${remoteDeviceLabel || 'Remote Device'}`,
                  )
                : connState === 'connecting'
                  ? t(
                      'Menyambungkan jalur terenkripsi WebRTC...',
                      'Negotiating encrypted WebRTC tunnel...',
                    )
                  : connState === 'initializing'
                    ? t('Menyiapkan kode ruangan...', 'Preparing room code...')
                    : t(
                        'Siap Dipasangkan — Scan QR atau Masukkan Kode 6 Digit',
                        'Ready to Pair — Scan QR or Enter 6-Digit Room Code',
                      )}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={12} className="text-[var(--success)]" />
                {t(
                  `Perangkat Anda: ${myDeviceLabel} • Enkripsi End-to-End DTLS 1.3 (Tanpa Cloud Storage)`,
                  `Your Device: ${myDeviceLabel} • DTLS 1.3 End-to-End Encrypted (Zero Cloud Storage)`,
                )}
              </span>
            </p>
          </div>
        </div>

        {connState === 'connected' && (
          <button
            id="wormhole-disconnect-btn"
            type="button"
            onClick={handleDisconnectPeer}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--error)] transition hover:bg-[var(--error)]/10"
          >
            <Unplug size={13} />
            {t('Putuskan', 'Disconnect')}
          </button>
        )}
      </div>

      {statusError && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-xs leading-5 text-[var(--error)]"
        >
          {statusError}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: PAIRING QR & 6-DIGIT JOIN */}
        <section className="space-y-5 lg:col-span-5">
          {/* Host Room Card */}
          <div className="ios-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                {t('Kode & QR Perangkat Ini', 'This Device’s Pairing QR')}
              </h2>
              <button
                id="wormhole-refresh-code-btn"
                type="button"
                onClick={handleRegenerateRoom}
                title={t('Buat kode ruangan baru', 'Generate new room code')}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
              >
                <RefreshCw size={12} />
                {t('Kode Baru', 'Reset')}
              </button>
            </div>

            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              {t(
                'Arahkan kamera HP lain ke QR di bawah untuk terhubung otomatis tanpa ketik apa pun.',
                'Point your other phone’s camera at this QR code to pair automatically in one tap.',
              )}
            </p>

            <div className="mt-4 flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Wormhole QR ${myRoomCode}`}
                  className="h-44 w-44 rounded-xl bg-white p-2 shadow-2xs sm:h-48 sm:w-48"
                />
              ) : (
                <div className="flex h-44 w-44 items-center justify-center rounded-xl bg-white">
                  <LoaderCircle
                    size={22}
                    className="animate-spin text-[var(--primary)]"
                  />
                </div>
              )}

              <div className="mt-3.5 text-center">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  {t('KODE RUANGAN 6 DIGIT', '6-DIGIT ROOM CODE')}
                </span>
                <p className="mt-0.5 font-mono text-2xl font-extrabold tracking-widest text-[var(--primary)]">
                  {formattedRoomDisplay}
                </p>
              </div>

              <div className="mt-3 flex w-full gap-2">
                <button
                  id="wormhole-copy-code-btn"
                  type="button"
                  onClick={() => void handleCopyString('code', myRoomCode)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                >
                  {copiedId === 'code' ? (
                    <Check size={13} className="text-[var(--success)]" />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copiedId === 'code'
                    ? t('Tersalin', 'Copied')
                    : t('Salin Kode', 'Copy Code')}
                </button>

                <button
                  id="wormhole-copy-link-btn"
                  type="button"
                  onClick={() => void handleCopyString('link', shareUrl)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                >
                  {copiedId === 'link' ? (
                    <Check size={13} className="text-[var(--success)]" />
                  ) : (
                    <Link2 size={13} />
                  )}
                  {copiedId === 'link'
                    ? t('Link Tersalin', 'Link Copied')
                    : t('Salin Link', 'Copy Link')}
                </button>
              </div>
            </div>
          </div>

          {/* Join Another Device Card */}
          <div className="ios-card p-4 sm:p-5">
            <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              {t('Sambungkan ke Perangkat Lawan', 'Join Another Device')}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
              {t(
                'Masukkan kode 6 digit yang tampil di layar laptop/HP lawan, atau buka pemindai kamera.',
                'Enter the 6-digit code displayed on your other device, or scan its QR directly.',
              )}
            </p>

            <div className="mt-3.5 flex gap-2">
              <input
                id="wormhole-join-code-input"
                type="text"
                maxLength={7}
                value={joinCodeInput}
                onChange={(e) =>
                  setJoinCodeInput(normalizeWormholeCode(e.target.value))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    connectToRemoteRoom(joinCodeInput)
                  }
                }}
                placeholder="A7K9P2"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 font-mono text-sm font-bold tracking-widest uppercase text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)]"
              />

              <button
                id="wormhole-join-submit-btn"
                type="button"
                disabled={
                  normalizeWormholeCode(joinCodeInput).length !==
                    WORMHOLE_CODE_LENGTH || connState === 'connecting'
                }
                onClick={() => connectToRemoteRoom(joinCodeInput)}
                className="shrink-0 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[var(--primary-hover)] disabled:opacity-40"
              >
                {t('Sambung', 'Connect')}
              </button>
            </div>

            <button
              id="wormhole-camera-scan-btn"
              type="button"
              onClick={() => void handleStartQrScanner()}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
            >
              {isScanningQr ? <X size={14} /> : <Camera size={14} />}
              {isScanningQr
                ? t('Tutup Kamera Pemindai', 'Close Camera Scanner')
                : t('Scan QR dari Kamera', 'Scan QR with Camera')}
            </button>

            {isScanningQr && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-black">
                <video
                  ref={(el) => {
                    scanVideoRef.current = el
                    if (el && scanStreamRef.current && el.srcObject !== scanStreamRef.current) {
                      el.srcObject = scanStreamRef.current
                      void el.play().catch(() => undefined)
                    }
                  }}
                  playsInline
                  muted
                  className="aspect-video w-full object-cover"
                />
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: FILE DROPZONE, INSTANT CLIPBOARD & TRANSFER STREAM */}
        <section className="space-y-5 lg:col-span-7">
          {/* Send Files & Text Workspace */}
          <div className="ios-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                {t(
                  'Kirim File Kualitas Asli & Teks Instan',
                  'Send Original Files & Instant Clipboard',
                )}
              </h2>

              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] select-none">
                <input
                  id="wormhole-autodownload-checkbox"
                  type="checkbox"
                  checked={autoDownloadFiles}
                  onChange={(e) => setAutoDownloadFiles(e.target.checked)}
                  className="h-3.5 w-3.5 rounded accent-[var(--primary)]"
                />
                {t('Simpan otomatis saat terima', 'Auto-save incoming files')}
              </label>
            </div>

            {/* File Drop Area */}
            <div
              id="wormhole-file-dropzone"
              onDragOver={(e) => {
                e.preventDefault()
                if (connState === 'connected') setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (connState === 'connected') {
                  fileInputRef.current?.click()
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (
                  connState === 'connected' &&
                  (e.key === 'Enter' || e.key === ' ')
                ) {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              className={`mt-3.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition ${
                connState !== 'connected'
                  ? 'cursor-not-allowed border-[var(--border)] bg-[var(--surface-soft)]/60 opacity-60'
                  : isDragging
                    ? 'cursor-pointer border-[var(--primary)] bg-[var(--primary-soft)]'
                    : 'cursor-pointer border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                {connState === 'connected' ? (
                  <Upload size={20} />
                ) : (
                  <Smartphone size={20} />
                )}
              </div>

              <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                {connState === 'connected'
                  ? t(
                      'Klik atau tarik berapa pun file untuk dikirim langsung',
                      'Tap or drop any files to beam directly',
                    )
                  : t(
                      'Hubungkan dua perangkat terlebih dahulu untuk mengirim file',
                      'Pair two devices on the left first to start beaming files',
                    )}
              </p>
              <p className="mt-1 max-w-md text-xs leading-5 text-[var(--text-secondary)]">
                {t(
                  'Foto iPhone/Android terkirim 100% resolusi utuh tanpa kompresi WA, video ratusan MB mengalir mulus per 64 KB.',
                  'Photos, videos, PDFs, and ZIP archives stream peer-to-peer with zero compression and no cloud size caps.',
                )}
              </p>
            </div>

            {/* Shared Clipboard / Instant Text Box */}
            <div className="mt-4 flex gap-2">
              <input
                id="wormhole-text-input"
                type="text"
                disabled={connState !== 'connected'}
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSendText()
                  }
                }}
                placeholder={t(
                  'Tempel link panjang, kode OTP, atau catatan cepat lalu tekan Enter...',
                  'Paste a URL, snippet, or note to beam to the other screen...',
                )}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] disabled:opacity-50"
              />
              <button
                id="wormhole-send-text-btn"
                type="button"
                disabled={connState !== 'connected' || !textDraft.trim()}
                onClick={handleSendText}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[var(--primary-hover)] disabled:opacity-40"
              >
                <Send size={14} />
                {t('Kirim', 'Send')}
              </button>
            </div>
          </div>

          {/* Live Transfer History Stream */}
          <div className="ios-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                {t('Riwayat Kiriman Sesi Ini', 'Session Transfer Feed')}
              </h2>
              {transfers.length > 0 && (
                <button
                  id="wormhole-clear-feed-btn"
                  type="button"
                  onClick={() => setTransfers([])}
                  className="text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                >
                  {t('Bersihkan', 'Clear')}
                </button>
              )}
            </div>

            {transfers.length === 0 ? (
              <p className="py-10 text-center text-xs text-[var(--text-muted)]">
                {t(
                  'Belum ada file atau teks yang dikirim pada sesi ini.',
                  'No files or clipboard items transferred in this session yet.',
                )}
              </p>
            ) : (
              <div className="mt-3.5 space-y-2.5">
                {transfers.map((item) => {
                  const isSent = item.direction === 'sent'
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              isSent
                                ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                                : 'bg-[var(--success)]/15 text-[var(--success)]'
                            }`}
                          >
                            {isSent ? (
                              <ArrowUpRight size={16} />
                            ) : (
                              <ArrowDownLeft size={16} />
                            )}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-[var(--text-primary)]">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-[11px] tabular-nums text-[var(--text-muted)]">
                              {isSent
                                ? t('Terkirim', 'Sent')
                                : t('Diterima', 'Received')}
                              {' • '}
                              {formatFileSize(item.size)}
                              {item.speedBps > 0
                                ? ` • ${formatTransferSpeed(item.speedBps)}`
                                : ''}
                            </p>
                          </div>
                        </div>

                        {item.kind === 'file' &&
                          item.status === 'completed' &&
                          item.blob && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadBlob(item.blob!, item.name)
                              }
                              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[var(--primary-hover)]"
                            >
                              <Download size={13} />
                              {t('Simpan', 'Save')}
                            </button>
                          )}

                        {item.kind === 'text' && item.textValue && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyString(item.id, item.textValue!)
                            }
                            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)] hover:text-[var(--primary)]"
                          >
                            {copiedId === item.id ? (
                              <Check
                                size={13}
                                className="text-[var(--success)]"
                              />
                            ) : (
                              <Copy size={13} />
                            )}
                            {copiedId === item.id
                              ? t('Tersalin', 'Copied')
                              : t('Salin', 'Copy')}
                          </button>
                        )}
                      </div>

                      {item.kind === 'text' && item.textValue && (
                        <pre className="mt-2.5 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2.5 font-mono text-xs leading-5 whitespace-pre-wrap break-words text-[var(--text-primary)]">
                          {item.textValue}
                        </pre>
                      )}

                      {item.status === 'transferring' && (
                        <div className="mt-2.5">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--segmented-bg)]">
                            <div
                              className="h-full rounded-full bg-[var(--primary)] transition-all duration-150"
                              style={{ width: `${Math.max(3, item.progress)}%` }}
                            />
                          </div>
                          <p className="mt-1 text-right font-mono text-[10px] font-bold tabular-nums text-[var(--primary)]">
                            {item.progress}%
                          </p>
                        </div>
                      )}

                      {item.kind === 'file' &&
                        item.status === 'completed' &&
                        item.blob &&
                        item.mimeType.startsWith('image/') && (
                          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                            <FileIcon size={12} />
                            <span>
                              {t(
                                'File gambar utuh diterima tanpa kompresi.',
                                'Full-resolution image received uncompressed.',
                              )}
                            </span>
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
