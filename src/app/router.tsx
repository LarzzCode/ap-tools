import { createBrowserRouter } from 'react-router'

import AppLayout from '../components/layout/AppLayout'
import About from '../pages/About'
import AllTools from '../pages/AllTools'
import AppError from '../pages/AppError'
import Feedback from '../pages/Feedback'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'
import Privacy from '../pages/Privacy'
import AspectCropper from '../pages/tools/AspectCropper'
import CarouselSplitter from '../pages/tools/CarouselSplitter'
import CleanUrl from '../pages/tools/CleanUrl'
import ColorPalette from '../pages/tools/ColorPalette'
import CvMaker from '../pages/tools/CvMaker'
import DeviceMockup from '../pages/tools/DeviceMockup'
import DiscountCalculator from '../pages/tools/DiscountCalculator'
import DocumentScanner from '../pages/tools/DocumentScanner'
import ImageCompressor from '../pages/tools/ImageCompressor'
import ImagePrivacy from '../pages/tools/ImagePrivacy'
import ImageStitcher from '../pages/tools/ImageStitcher'
import ImageToPdf from '../pages/tools/ImageToPdf'
import InvoiceGenerator from '../pages/tools/InvoiceGenerator'
import KtpWatermark from '../pages/tools/KtpWatermark'
import LetterGenerator from '../pages/tools/LetterGenerator'
import LivePhotobooth from '../pages/tools/LivePhotobooth'
import LoanCalculator from '../pages/tools/LoanCalculator'
import MediaConverter from '../pages/tools/MediaConverter'
import PasFoto from '../pages/tools/PasFoto'
import PdfCompressor from '../pages/tools/PdfCompressor'
import PdfMerge from '../pages/tools/PdfMerge'
import PdfOrganizer from '../pages/tools/PdfOrganizer'
import PdfSign from '../pages/tools/PdfSign'
import PdfSplit from '../pages/tools/PdfSplit'
import PdfToImage from '../pages/tools/PdfToImage'
import PhotoCollage from '../pages/tools/PhotoCollage'
import PrivacyBlurBrush from '../pages/tools/PrivacyBlurBrush'
import QrGenerator from '../pages/tools/QrGenerator'
import QrScanner from '../pages/tools/QrScanner'
import RemoveBackground from '../pages/tools/RemoveBackground'
import SignatureExtractor from '../pages/tools/SignatureExtractor'
import Teleprompter from '../pages/tools/Teleprompter'
import TextUtilities from '../pages/tools/TextUtilities'
import TwibbonMaker from '../pages/tools/TwibbonMaker'
import VCardQr from '../pages/tools/VCardQr'
import VoiceChanger from '../pages/tools/VoiceChanger'
import WhatsAppLink from '../pages/tools/WhatsAppLink'
import WifiQr from '../pages/tools/WifiQr'
import YouTubeDownloader from '../pages/tools/YouTubeDownloader'

export const router = createBrowserRouter([
  {
    Component: AppLayout,
    ErrorBoundary: AppError,

    children: [
      {
        path: '/',
        Component: Home,
      },
      {
        path: '/tools',
        Component: AllTools,
      },
      {
        path: '/tools/ktp-watermark',
        Component: KtpWatermark,
      },
      {
        path: '/tools/image-to-pdf',
        Component: ImageToPdf,
      },
      {
        path: '/tools/image-compressor',
        Component: ImageCompressor,
      },
      {
        path: '/tools/remove-background',
        Component: RemoveBackground,
      },
      {
        path: '/tools/pas-foto',
        Component: PasFoto,
      },
      {
        path: '/tools/image-privacy',
        Component: ImagePrivacy,
      },
      {
        path: '/tools/image-stitcher',
        Component: ImageStitcher,
      },
      {
        path: '/tools/aspect-cropper',
        Component: AspectCropper,
      },
      {
        path: '/tools/color-palette',
        Component: ColorPalette,
      },
      {
        path: '/tools/twibbon-maker',
        Component: TwibbonMaker,
      },
      {
        path: '/tools/device-mockup',
        Component: DeviceMockup,
      },
      {
        path: '/tools/signature-extractor',
        Component: SignatureExtractor,
      },
      {
        path: '/tools/document-scanner',
        Component: DocumentScanner,
      },
      {
        path: '/tools/photo-collage',
        Component: PhotoCollage,
      },
      {
        path: '/tools/live-photobooth',
        Component: LivePhotobooth,
      },
      {
        path: '/tools/voice-changer',
        Component: VoiceChanger,
      },
      {
        path: '/tools/carousel-splitter',
        Component: CarouselSplitter,
      },
      {
        path: '/tools/privacy-blur-brush',
        Component: PrivacyBlurBrush,
      },
      {
        path: '/tools/pdf-to-image',
        Component: PdfToImage,
      },
      {
        path: '/tools/pdf-merge',
        Component: PdfMerge,
      },
      {
        path: '/tools/pdf-split',
        Component: PdfSplit,
      },
      {
        path: '/tools/pdf-organizer',
        Component: PdfOrganizer,
      },
      {
        path: '/tools/pdf-sign',
        Component: PdfSign,
      },
      {
        path: '/tools/pdf-compressor',
        Component: PdfCompressor,
      },
      {
        path: '/tools/cv-maker',
        Component: CvMaker,
      },
      {
        path: '/tools/letter-generator',
        Component: LetterGenerator,
      },
      {
        path: '/tools/invoice-generator',
        Component: InvoiceGenerator,
      },
      {
        path: '/tools/text-utilities',
        Component: TextUtilities,
      },
      {
        path: '/tools/teleprompter',
        Component: Teleprompter,
      },
      {
        path: '/tools/loan-calculator',
        Component: LoanCalculator,
      },
      {
        path: '/tools/discount-calculator',
        Component: DiscountCalculator,
      },
      {
        path: '/tools/wifi-qr',
        Component: WifiQr,
      },
      {
        path: '/tools/qr-generator',
        Component: QrGenerator,
      },
      {
        path: '/tools/qr-scanner',
        Component: QrScanner,
      },
      {
        path: '/tools/whatsapp-link',
        Component: WhatsAppLink,
      },
      {
        path: '/tools/vcard-qr',
        Component: VCardQr,
      },
      {
        path: '/tools/clean-url',
        Component: CleanUrl,
      },
      {
        path: '/tools/youtube-downloader',
        Component: YouTubeDownloader,
      },
      {
        path: '/tools/media-converter',
        Component: MediaConverter,
      },
      {
        path: '/feedback',
        Component: Feedback,
      },
      {
        path: '/about',
        Component: About,
      },
      {
        path: '/privacy',
        Component: Privacy,
      },
    ],
  },
  {
    path: '*',
    Component: NotFound,
  },
])