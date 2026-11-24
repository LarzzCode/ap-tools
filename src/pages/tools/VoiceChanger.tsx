import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  AudioWaveform,
  Download,
  LoaderCircle,
  Mic,
  Square,
  Upload,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { downloadBlob } from '../../utils/download'

type VoiceEffectId =
  | 'anonymous'
  | 'chipmunk'
  | 'robot'
  | 'radio'
  | 'echo'
  | 'clean'

interface VoiceEffectMeta {
  id: VoiceEffectId
  nameId: string
  nameEn: string
  descId: string
  descEn: string
}

const VOICE_EFFECTS: VoiceEffectMeta[] = [
  {
    id: 'anonymous',
    nameId: 'Anonymous (Suara Berat)',
    nameEn: 'Anonymous (Deep Pitch)',
    descId: 'Nada suara rendah & berat ala wawancara rahasia',
    descEn: 'Deep, disguised lower-pitched voice with bass boost',
  },
  {
    id: 'chipmunk',
    nameId: 'Chipmunk (Suara Lucu)',
    nameEn: 'Chipmunk (High Pitch)',
    descId: 'Nada suara tinggi & cepat ala kartun',
    descEn: 'Fast, high-pitched cartoon voice effect',
  },
  {
    id: 'robot',
    nameId: 'Robot Cyborg',
    nameEn: 'Cyborg Robot',
    descId: 'Modulasi frekuensi metalik ala suara robot',
    descEn: 'Metallic 52 Hz ring-modulated robotic synth voice',
  },
  {
    id: 'radio',
    nameId: 'Radio Walkie-Talkie (HT)',
    nameEn: 'Walkie-Talkie Radio',
    descId: 'Efek pemancar radio komunikasi taktis',
    descEn: 'Bandpass-filtered tactical two-way radio sound',
  },
  {
    id: 'echo',
    nameId: 'Gema Aula / Studio Echo',
    nameEn: 'Hall Echo & Reverb',
    descId: 'Pantulan gema suara dramatis di ruangan besar',
    descEn: 'Spacious multi-tap feedback echo chamber',
  },
  {
    id: 'clean',
    nameId: 'Penguat Suara Jernih',
    nameEn: 'Vocal Presence & Boost',
    descId: 'Perjelas vokal & kencangkan volume rekaman',
    descEn: 'Boost vocal clarity and overall recording loudness',
  },
]

function encodeAudioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels)
  const sampleRate = buffer.sampleRate
  const numFrames = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = numFrames * blockAlign
  const arrayBuffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(arrayBuffer)

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // 16-bit
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const channels: Float32Array[] = []
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c))
  }

  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]))
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, int16, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function makeDistortionCurve(amount = 35): Float32Array<ArrayBuffer> {
  const samples = 44100
  const curve = new Float32Array(new ArrayBuffer(samples * 4))
  const deg = Math.PI / 180
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] =
      ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
  }
  return curve
}

async function renderVoiceEffect(
  sourceBuffer: AudioBuffer,
  effect: VoiceEffectId,
): Promise<Blob> {
  const playbackRate =
    effect === 'anonymous' ? 0.76 : effect === 'chipmunk' ? 1.4 : 1.0

  const extraTailSeconds = effect === 'echo' ? 1.4 : 0.1
  const outLength =
    Math.ceil(sourceBuffer.length / playbackRate) +
    Math.ceil(sourceBuffer.sampleRate * extraTailSeconds)

  const offlineCtx = new OfflineAudioContext(
    Math.min(2, sourceBuffer.numberOfChannels),
    Math.max(1, outLength),
    sourceBuffer.sampleRate,
  )

  const source = offlineCtx.createBufferSource()
  source.buffer = sourceBuffer
  source.playbackRate.value = playbackRate

  if (effect === 'anonymous') {
    const lowShelf = offlineCtx.createBiquadFilter()
    lowShelf.type = 'lowshelf'
    lowShelf.frequency.value = 180
    lowShelf.gain.value = 8
    source.connect(lowShelf)
    lowShelf.connect(offlineCtx.destination)
  } else if (effect === 'chipmunk') {
    const highShelf = offlineCtx.createBiquadFilter()
    highShelf.type = 'highshelf'
    highShelf.frequency.value = 1600
    highShelf.gain.value = 5
    source.connect(highShelf)
    highShelf.connect(offlineCtx.destination)
  } else if (effect === 'robot') {
    // Ring modulator with 52Hz carrier oscillator
    const ringGain = offlineCtx.createGain()
    ringGain.gain.value = 0

    const osc = offlineCtx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 52
    osc.connect(ringGain.gain)

    const dryGain = offlineCtx.createGain()
    dryGain.gain.value = 0.45

    source.connect(ringGain)
    source.connect(dryGain)
    ringGain.connect(offlineCtx.destination)
    dryGain.connect(offlineCtx.destination)
    osc.start(0)
  } else if (effect === 'radio') {
    const bandpass = offlineCtx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.value = 1350
    bandpass.Q.value = 1.6

    const shaper = offlineCtx.createWaveShaper()
    shaper.curve = makeDistortionCurve(28)
    shaper.oversample = '2x'

    source.connect(bandpass)
    bandpass.connect(shaper)
    shaper.connect(offlineCtx.destination)
  } else if (effect === 'echo') {
    const delay = offlineCtx.createDelay(2.0)
    delay.delayTime.value = 0.22

    const feedback = offlineCtx.createGain()
    feedback.gain.value = 0.44

    const wetGain = offlineCtx.createGain()
    wetGain.gain.value = 0.55

    source.connect(offlineCtx.destination)
    source.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wetGain)
    wetGain.connect(offlineCtx.destination)
  } else {
    // Clean vocal presence & volume boost
    const peaking = offlineCtx.createBiquadFilter()
    peaking.type = 'peaking'
    peaking.frequency.value = 2600
    peaking.Q.value = 1.0
    peaking.gain.value = 5

    const boost = offlineCtx.createGain()
    boost.gain.value = 1.35

    source.connect(peaking)
    peaking.connect(boost)
    boost.connect(offlineCtx.destination)
  }

  source.start(0)
  const renderedBuffer = await offlineCtx.startRendering()
  return encodeAudioBufferToWav(renderedBuffer)
}

export default function VoiceChanger() {
  const { language, t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [sourceBuffer, setSourceBuffer] = useState<AudioBuffer | null>(null)
  const [sourceLabel, setSourceLabel] = useState('')
  const [effect, setEffect] = useState<VoiceEffectId>('anonymous')
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [outputUrl, setOutputUrl] = useState('')

  const [isRecording, setIsRecording] = useState(false)
  const [recordingSec, setRecordingSec] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  // Timer during microphone recording
  useEffect(() => {
    if (!isRecording) return
    const id = window.setInterval(() => {
      setRecordingSec((prev) => prev + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [isRecording])

  // Automatically re-render voice effect whenever sourceBuffer or effect changes
  useEffect(() => {
    if (!sourceBuffer) return

    let cancelled = false

    renderVoiceEffect(sourceBuffer, effect)
      .then((wavBlob) => {
        if (cancelled) return
        setOutputBlob(wavBlob)
        const url = URL.createObjectURL(wavBlob)
        setOutputUrl((prevUrl) => {
          if (prevUrl) URL.revokeObjectURL(prevUrl)
          return url
        })
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            t('Gagal memproses efek suara.', 'Failed to apply voice effect.'),
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsProcessing(false)
      })

    return () => {
      cancelled = true
    }
  }, [sourceBuffer, effect, t])

  async function decodeBlobToAudioBuffer(blob: Blob, label: string) {
    setError('')
    setIsProcessing(true)
    try {
      const arrayBuf = await blob.arrayBuffer()
      const audioCtx = new AudioContext()
      const decoded = await audioCtx.decodeAudioData(arrayBuf)
      await audioCtx.close()
      setSourceBuffer(decoded)
      setSourceLabel(label)
    } catch {
      setIsProcessing(false)
      setError(
        t(
          'Format audio tidak didukung oleh browser ini.',
          'Audio format could not be decoded by this browser.',
        ),
      )
    }
  }

  async function handleStartRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop())
        const recordedBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        void decodeBlobToAudioBuffer(
          recordedBlob,
          t('Rekaman Mikrofon', 'Microphone Recording'),
        )
      }

      setRecordingSec(0)
      setIsRecording(true)
      recorder.start()
    } catch {
      setError(
        t(
          'Izin mikrofon ditolak atau tidak tersedia. Anda tetap bisa mengunggah file audio.',
          'Microphone permission denied or unavailable. You can still upload an audio file.',
        ),
      )
    }
  }

  function handleStopRecording() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) {
      void decodeBlobToAudioBuffer(file, file.name)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="voice-changer" />

      <input
        id="voice-changer-input"
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: Record or Upload Audio */}
        <section className="ios-card h-fit space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              {t('1. Rekam Suara atau Pilih File Audio', '1. Record or Upload Audio')}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {t(
                'Rekam langsung dari mikrofon HP/laptop atau unggah file voice note.',
                'Record straight from your microphone or upload an audio file.',
              )}
            </p>
          </div>

          <div className="grid gap-2.5">
            {!isRecording ? (
              <button
                id="voice-record-start-btn"
                type="button"
                onClick={() => void handleStartRecording()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95 sm:text-sm"
              >
                <Mic size={17} />
                {t('Rekam Suara dari Mikrofon', 'Record Voice from Microphone')}
              </button>
            ) : (
              <button
                id="voice-record-stop-btn"
                type="button"
                onClick={handleStopRecording}
                className="flex w-full animate-pulse items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3.5 text-xs font-bold text-white shadow-xs sm:text-sm"
              >
                <Square size={16} fill="currentColor" />
                {t(
                  `Berhenti Rekam (${recordingSec} dtk)`,
                  `Stop Recording (${recordingSec}s)`,
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
            >
              <Upload size={15} className="text-[var(--primary)]" />
              {t(
                'Atau Pilih File Audio / Voice Note (MP3/WAV)',
                'Or Choose Audio File (MP3/WAV/M4A)',
              )}
            </button>
          </div>

          {sourceBuffer && (
            <div className="rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)]/50 px-3.5 py-2.5 text-xs">
              <p className="truncate font-bold text-[var(--primary)]">
                {t('Sumber Suara:', 'Audio Source:')} {sourceLabel}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {t('Durasi:', 'Duration:')} {sourceBuffer.duration.toFixed(1)}{' '}
                {t('detik', 'seconds')} • {sourceBuffer.sampleRate} Hz
              </p>
            </div>
          )}

          {/* Voice Effects Grid */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('2. Pilih Karakter Efek Suara', '2. Select Voice Effect')}
            </label>
            <div className="mt-2 space-y-2">
              {VOICE_EFFECTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (sourceBuffer && item.id !== effect) {
                      setIsProcessing(true)
                    }
                    setEffect(item.id)
                  }}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    effect === item.id
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${
                      effect === item.id
                        ? 'text-[var(--primary)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {language === 'id' ? item.nameId : item.nameEn}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                    {language === 'id' ? item.descId : item.descEn}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-[var(--error)]">
              {error}
            </p>
          )}
        </section>

        {/* Right: Audio Player & Download */}
        <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
          <div>
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t(
                    'Pratinjau & Unduh Hasil Suara',
                    'Preview & Download Transformed Audio',
                  )}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {t(
                    'Ganti efek di sebelah kiri untuk langsung mendengar perubahan suara.',
                    'Switch effects on the left to hear your transformed voice immediately.',
                  )}
                </p>
              </div>
              <AudioWaveform size={18} className="text-[var(--primary)]" />
            </div>

            <div className="my-8 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-6 text-center">
              {isProcessing ? (
                <div className="space-y-2">
                  <LoaderCircle
                    size={28}
                    className="mx-auto animate-spin text-[var(--primary)]"
                  />
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {t(
                      'Sedang merender efek audio...',
                      'Rendering studio voice effect...',
                    )}
                  </p>
                </div>
              ) : outputUrl && outputBlob ? (
                <div className="w-full max-w-md space-y-5">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] shadow-xs">
                    <AudioWaveform size={32} />
                  </div>

                  <div>
                    <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[11px] font-bold text-[var(--primary)]">
                      {language === 'id'
                        ? VOICE_EFFECTS.find((v) => v.id === effect)?.nameId
                        : VOICE_EFFECTS.find((v) => v.id === effect)?.nameEn}
                    </span>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      {t(
                        'Tekan tombol Play di bawah untuk mendengarkan hasil perubahan suara:',
                        'Press Play below to listen to the transformed voice audio:',
                      )}
                    </p>
                  </div>

                  <audio
                    controls
                    src={outputUrl}
                    className="w-full"
                  />

                  <button
                    id="voice-changer-download-btn"
                    type="button"
                    onClick={() =>
                      downloadBlob(
                        outputBlob,
                        `ditya-tools-suara-${effect}.wav`,
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3.5 text-sm font-bold text-white shadow-xs transition hover:opacity-95"
                  >
                    <Download size={16} />
                    {t(
                      'Unduh File Audio (.WAV)',
                      'Download Transformed Audio (.WAV)',
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Mic size={26} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">
                    {t(
                      'Belum ada rekaman atau file suara',
                      'No voice recording or audio file loaded',
                    )}
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
                    {t(
                      'Klik tombol "Rekam Suara dari Mikrofon" di sebelah kiri lalu ucapkan kalimat apa saja.',
                      'Click "Record Voice from Microphone" on the left and speak any phrase.',
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-[11px] text-[var(--text-muted)]">
            {t(
              'Diproses 100% di dalam browser menggunakan Web Audio API tanpa mengunggah rekaman suara Anda.',
              'Processed 100% inside your browser via Web Audio API without uploading your voice anywhere.',
            )}
          </p>
        </section>
      </div>
    </main>
  )
}
