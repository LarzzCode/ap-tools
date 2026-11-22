import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Download,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'

import { useLanguage } from '../../hooks/useLanguage'
import {
  calculateInvoiceTotals,
  formatMoney,
  generateInvoicePdf,
  type InvoiceCurrency,
  type InvoiceDocKind,
  type InvoiceLineItem,
  type InvoiceStamp,
} from '../../lib/invoiceGenerator'
import { downloadBlob } from '../../utils/download'

export default function InvoiceGenerator() {
  const { t } = useLanguage()

  const todayIso = useMemo(() => {
    const now = new Date()
    return now.toISOString().slice(0, 10)
  }, [])

  const [kind, setKind] = useState<InvoiceDocKind>('invoice')
  const [currency, setCurrency] = useState<InvoiceCurrency>('IDR')
  const [stamp, setStamp] = useState<InvoiceStamp>('unpaid')

  const [docNumber, setDocNumber] = useState('INV-2026-001')
  const [issueDate, setIssueDate] = useState(todayIso)
  const [dueDate, setDueDate] = useState('')

  const [senderName, setSenderName] = useState('Studio Kreatif Nusantara')
  const [senderContact, setSenderContact] = useState('WhatsApp: 0812-3456-7890')
  const [clientName, setClientName] = useState('PT Maju Bersama')
  const [clientContact, setClientContact] = useState('Jakarta, Indonesia')

  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: 'item-1',
      description: 'Jasa Desain & Pengembangan Web',
      quantity: 1,
      unitPrice: 1500000,
    },
  ])

  const [discountAmount, setDiscountAmount] = useState(0)
  const [taxPercent, setTaxPercent] = useState(0)
  const [notes, setNotes] = useState(
    'Pembayaran via Transfer BCA 1234567890 a/n Studio Kreatif Nusantara.',
  )

  const [isExporting, setIsExporting] = useState(false)
  const [success, setSuccess] = useState('')

  const totals = useMemo(
    () => calculateInvoiceTotals(items, discountAmount, taxPercent),
    [items, discountAmount, taxPercent],
  )

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ])
  }

  function updateItem(
    id: string,
    patch: Partial<Omit<InvoiceLineItem, 'id'>>,
  ) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function removeItem(id: string) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleDownloadPdf() {
    setIsExporting(true)
    setSuccess('')

    try {
      const pdfBlob = await generateInvoicePdf({
        kind,
        currency,
        stamp,
        docNumber,
        issueDate,
        dueDate,
        senderName,
        senderContact,
        clientName,
        clientContact,
        items,
        discountAmount,
        taxPercent,
        notes,
      })

      const cleanNum =
        docNumber.trim().replace(/[^a-zA-Z0-9_-]+/g, '-') || 'document'
      const prefix = kind === 'invoice' ? 'invoice' : 'kwitansi'
      downloadBlob(pdfBlob, `${prefix}-${cleanNum}.pdf`)
      setSuccess(
        t(
          'Dokumen PDF berhasil dibuat dan diunduh.',
          'PDF document generated and downloaded.',
        ),
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <ToolPageHeader toolId="invoice-generator" />

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Form Editor */}
          <div className="space-y-5 lg:col-span-7">
            <section className="ios-card p-5 sm:p-6 space-y-5">
              {/* Top toggles */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Jenis Dokumen', 'Document Type')}
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <button
                      id="inv-kind-invoice"
                      type="button"
                      onClick={() => {
                        setKind('invoice')
                        if (stamp === 'paid') setStamp('unpaid')
                      }}
                      className={`rounded-xl border px-2.5 py-2 text-xs font-semibold ${
                        kind === 'invoice'
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      Invoice
                    </button>
                    <button
                      id="inv-kind-receipt"
                      type="button"
                      onClick={() => {
                        setKind('receipt')
                        setStamp('paid')
                      }}
                      className={`rounded-xl border px-2.5 py-2 text-xs font-semibold ${
                        kind === 'receipt'
                          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {t('Kwitansi', 'Receipt')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Mata Uang', 'Currency')}
                  </label>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {(['IDR', 'USD'] as const).map((curr) => (
                      <button
                        key={curr}
                        id={`inv-curr-${curr}`}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`rounded-xl border px-2.5 py-2 text-xs font-semibold ${
                          currency === curr
                            ? 'border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]'
                            : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {curr === 'IDR' ? 'IDR (Rp)' : 'USD ($)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Stempel Status', 'Status Stamp')}
                  </label>
                  <select
                    id="inv-stamp-select"
                    value={stamp}
                    onChange={(e) => setStamp(e.target.value as InvoiceStamp)}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] outline-none"
                  >
                    <option value="paid">
                      {t('LUNAS (PAID)', 'PAID (LUNAS)')}
                    </option>
                    <option value="unpaid">
                      {t('BELUM LUNAS', 'UNPAID')}
                    </option>
                    <option value="none">
                      {t('Tanpa Stempel', 'No Stamp')}
                    </option>
                  </select>
                </div>
              </div>

              {/* Meta fields */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="inv-doc-number"
                    className="text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {t('Nomor Dokumen', 'Document Number')}
                  </label>
                  <input
                    id="inv-doc-number"
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="inv-issue-date"
                    className="text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {t('Tanggal Terbit', 'Issue Date')}
                  </label>
                  <input
                    id="inv-issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="inv-due-date"
                    className="text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {t('Jatuh Tempo (Opsional)', 'Due Date (Optional)')}
                  </label>
                  <input
                    id="inv-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {/* Sender & Client */}
              <div className="grid gap-4 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Dari (Pengirim / Usaha Anda)', 'From (Sender / Business)')}
                  </label>
                  <input
                    id="inv-sender-name"
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={t('Nama Usaha / Freelancer', 'Business / Your Name')}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                  <input
                    id="inv-sender-contact"
                    type="text"
                    value={senderContact}
                    onChange={(e) => setSenderContact(e.target.value)}
                    placeholder={t('No HP / Email / Alamat', 'Phone / Email / Address')}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Kepada (Klien / Pelanggan)', 'Bill To (Client)')}
                  </label>
                  <input
                    id="inv-client-name"
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder={t('Nama Klien / Perusahaan', 'Client Name / Company')}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                  <input
                    id="inv-client-contact"
                    type="text"
                    value={clientContact}
                    onChange={(e) => setClientContact(e.target.value)}
                    placeholder={t('Kontak / Alamat Klien', 'Client Contact / Address')}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 border-t border-[var(--border)] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {t('Rincian Barang / Jasa', 'Line Items')}
                  </span>
                  <button
                    id="inv-add-item-btn"
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]"
                  >
                    <Plus size={13} />
                    {t('Tambah Baris', 'Add Item')}
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-2.5"
                  >
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, { description: e.target.value })
                      }
                      placeholder={t(`Deskripsi item #${idx + 1}`, `Item #${idx + 1} description`)}
                      className="col-span-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, {
                          quantity: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      placeholder="Qty"
                      className="col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-center text-xs text-[var(--text-primary)] outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(item.id, {
                          unitPrice: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      placeholder={t('Harga', 'Price')}
                      className="col-span-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
                    />
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => removeItem(item.id)}
                      className="col-span-1 flex justify-center text-[var(--text-muted)] hover:text-[var(--error)] disabled:opacity-30"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Discount, Tax, Notes */}
              <div className="grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="inv-discount"
                    className="text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {t(`Potongan Diskon (${currency})`, `Discount (${currency})`)}
                  </label>
                  <input
                    id="inv-discount"
                    type="number"
                    min={0}
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="inv-tax"
                    className="text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    {t('Pajak / PPN (%)', 'Tax (%)')}
                  </label>
                  <input
                    id="inv-tax"
                    type="number"
                    min={0}
                    max={100}
                    value={taxPercent}
                    onChange={(e) =>
                      setTaxPercent(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inv-notes"
                  className="text-xs font-semibold text-[var(--text-secondary)]"
                >
                  {t(
                    'Catatan & Nomor Rekening Pembayaran',
                    'Payment Instructions & Notes',
                  )}
                </label>
                <textarea
                  id="inv-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
            </section>
          </div>

          {/* Live Summary Preview & Export */}
          <div className="lg:col-span-5">
            <div className="ios-card p-6 space-y-5">
              <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                    {kind === 'invoice' ? 'INVOICE' : 'KWITANSI / RECEIPT'}
                  </span>
                  <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                    {docNumber || 'INV-001'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {issueDate}
                  </p>
                </div>

                {stamp !== 'none' && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      stamp === 'paid'
                        ? 'bg-green-500/15 text-[var(--success)]'
                        : 'bg-red-500/15 text-[var(--error)]'
                    }`}
                  >
                    {stamp === 'paid' ? 'LUNAS / PAID' : 'BELUM LUNAS'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[var(--text-muted)]">
                    {t('Dari:', 'From:')}
                  </span>
                  <p className="mt-0.5 font-bold text-[var(--text-primary)]">
                    {senderName || '-'}
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    {senderContact}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">
                    {t('Kepada:', 'To:')}
                  </span>
                  <p className="mt-0.5 font-bold text-[var(--text-primary)]">
                    {clientName || '-'}
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    {clientContact}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-[var(--border)] pt-4 text-xs">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-[var(--text-secondary)]"
                  >
                    <span className="truncate pr-2">
                      {item.description || 'Item'} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-semibold text-[var(--text-primary)]">
                      {formatMoney(item.quantity * item.unitPrice, currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 border-t border-[var(--border)] pt-4 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span>{formatMoney(totals.subtotal, currency)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>{t('Diskon', 'Discount')}</span>
                    <span>- {formatMoney(totals.discount, currency)}</span>
                  </div>
                )}
                {taxPercent > 0 && (
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>
                      {t('Pajak', 'Tax')} ({taxPercent}%)
                    </span>
                    <span>{formatMoney(totals.taxAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[var(--border)] pt-2.5 text-base font-bold text-[var(--primary)]">
                  <span>{t('Total Akhir', 'Grand Total')}</span>
                  <span>{formatMoney(totals.grandTotal, currency)}</span>
                </div>
              </div>

              <button
                id="inv-download-pdf-btn"
                type="button"
                disabled={isExporting}
                onClick={() => void handleDownloadPdf()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {isExporting ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {t('Unduh Dokumen PDF', 'Download PDF Document')}
              </button>

              {success && (
                <p className="inline-flex w-full items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2.5 text-xs text-[var(--success)]">
                  <Check size={15} />
                  {success}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
