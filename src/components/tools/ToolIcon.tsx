import {
  BriefcaseBusiness,
  Calculator,
  Columns2,
  Contact,
  Crop,
  Eraser,
  FileDown,
  FileImage,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Film,
  Frame,
  IdCard,
  ImageDown,
  Images,
  Layers,
  LayoutGrid,
  Link2Off,
  Merge,
  MessageCircle,
  MonitorSmartphone,
  Palette,
  PenTool,
  Percent,
  Play,
  QrCode,
  ScanLine,
  ScanText,
  Scissors,
  ShieldAlert,
  ShieldCheck,
  TvMinimalPlay,
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

    case 'pdf-to-image':
      return <ImageDown {...props} />

    case 'image-compressor':
      return <Images {...props} />

    case 'remove-background':
      return <Eraser {...props} />

    case 'pas-foto':
      return <IdCard {...props} />

    case 'image-privacy':
      return <ShieldCheck {...props} />

    case 'image-stitcher':
      return <Columns2 {...props} />

    case 'aspect-cropper':
      return <Crop {...props} />

    case 'color-palette':
      return <Palette {...props} />

    case 'twibbon-maker':
      return <Frame {...props} />

    case 'device-mockup':
      return <MonitorSmartphone {...props} />

    case 'signature-extractor':
      return <PenTool {...props} />

    case 'document-scanner':
      return <ScanText {...props} />

    case 'photo-collage':
      return <LayoutGrid {...props} />

    case 'pdf-merge':
      return <Merge {...props} />

    case 'pdf-split':
      return <Scissors {...props} />

    case 'pdf-organizer':
      return <Layers {...props} />

    case 'pdf-sign':
      return <FileSignature {...props} />

    case 'pdf-compressor':
      return <FileDown {...props} />

    case 'cv-maker':
      return <BriefcaseBusiness {...props} />

    case 'letter-generator':
      return <FileText {...props} />

    case 'invoice-generator':
      return <FileSpreadsheet {...props} />

    case 'text-utilities':
      return <Type {...props} />

    case 'teleprompter':
      return <TvMinimalPlay {...props} />

    case 'loan-calculator':
      return <Calculator {...props} />

    case 'discount-calculator':
      return <Percent {...props} />

    case 'wifi-qr':
      return <Wifi {...props} />

    case 'qr-generator':
      return <QrCode {...props} />

    case 'qr-scanner':
      return <ScanLine {...props} />

    case 'whatsapp-link':
      return <MessageCircle {...props} />

    case 'vcard-qr':
      return <Contact {...props} />

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