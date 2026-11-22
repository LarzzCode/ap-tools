import {
  Eraser,
  FileImage,
  FileSignature,
  FileSpreadsheet,
  Film,
  IdCard,
  Images,
  Layers,
  Link2Off,
  Merge,
  MessageCircle,
  Play,
  QrCode,
  ScanLine,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  Type,
  Wifi,
} from 'lucide-react'

interface ToolIconProps {
  toolId: string
  size?: number
}

export default function ToolIcon({
  toolId,
  size = 22,
}: ToolIconProps) {
  const props = {
    size,
    strokeWidth: 1.8,
  }

  switch (toolId) {
    case 'ktp-watermark':
      return <ShieldAlert {...props} />

    case 'image-to-pdf':
      return <FileImage {...props} />

    case 'image-compressor':
      return <Images {...props} />

    case 'remove-background':
      return <Eraser {...props} />

    case 'pas-foto':
      return <IdCard {...props} />

    case 'image-privacy':
      return <ShieldCheck {...props} />

    case 'pdf-merge':
      return <Merge {...props} />

    case 'pdf-split':
      return <Scissors {...props} />

    case 'pdf-organizer':
      return <Layers {...props} />

    case 'pdf-sign':
      return <FileSignature {...props} />

    case 'invoice-generator':
      return <FileSpreadsheet {...props} />

    case 'text-utilities':
      return <Type {...props} />

    case 'wifi-qr':
      return <Wifi {...props} />

    case 'qr-generator':
      return <QrCode {...props} />

    case 'qr-scanner':
      return <ScanLine {...props} />

    case 'whatsapp-link':
      return <MessageCircle {...props} />

    case 'clean-url':
      return <Link2Off {...props} />

    case 'youtube-downloader':
      return <Play {...props} />

    case 'media-converter':
      return <Film {...props} />

    default:
      return <FileImage {...props} />
  }
}