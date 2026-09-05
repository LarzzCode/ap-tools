import {
  FileImage,
  Images,
  MessageCircle,
  Music2,
  Play,
  QrCode,
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
    case 'image-to-pdf':
      return <FileImage {...props} />

    case 'image-compressor':
      return <Images {...props} />

    case 'qr-generator':
      return <QrCode {...props} />

    case 'whatsapp-link':
      return <MessageCircle {...props} />

    case 'youtube-downloader':
      return <Play {...props} />

    case 'tiktok-downloader':
      return <Music2 {...props} />

    default:
      return <FileImage {...props} />
  }
}