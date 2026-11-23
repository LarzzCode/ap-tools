import { useMemo, useState } from 'react'
import {
  Award,
  Percent,
  Plus,
  Scale,
  ShoppingBag,
  Trash2,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'

interface ProductCompareItem {
  id: string
  name: string
  price: number
  quantity: number
  packs: number
}

function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`
}

export default function DiscountCalculator() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'discount' | 'compare'>('discount')

  // Tab 1: Double Discount & Tax State
  const [originalPrice, setOriginalPrice] = useState(250000)
  const [discount1, setDiscount1] = useState(50)
  const [discount2, setDiscount2] = useState(20)
  const [voucherOff, setVoucherOff] = useState(0)
  const [includePpn, setIncludePpn] = useState(false)

  // Tab 2: Unit Price Comparison State
  const [unitType, setUnitType] = useState<'g-ml' | 'pcs'>('g-ml')
  const [items, setItems] = useState<ProductCompareItem[]>([
    {
      id: 'item-1',
      name: 'Kemasan Sedang (450 ml)',
      price: 24500,
      quantity: 450,
      packs: 1,
    },
    {
      id: 'item-2',
      name: 'Kemasan Besar Promo (800 ml)',
      price: 38900,
      quantity: 800,
      packs: 1,
    },
  ])

  const discountResult = useMemo(() => {
    const base = Math.max(0, originalPrice)
    const d1 = Math.max(0, Math.min(100, discount1))
    const d2 = Math.max(0, Math.min(100, discount2))

    const afterD1 = base * (1 - d1 / 100)
    const afterD2 = afterD1 * (1 - d2 / 100)
    const afterVoucher = Math.max(0, afterD2 - Math.max(0, voucherOff))
    const taxAmount = includePpn ? afterVoucher * 0.11 : 0
    const finalPay = afterVoucher + taxAmount

    const totalSaved = Math.max(0, base - afterVoucher)
    const effectiveDiscountPct =
      base > 0 ? ((base - afterVoucher) / base) * 100 : 0

    return {
      afterD1,
      afterD2,
      afterVoucher,
      taxAmount,
      finalPay,
      totalSaved,
      effectiveDiscountPct,
    }
  }, [originalPrice, discount1, discount2, voucherOff, includePpn])

  const compareAnalysis = useMemo(() => {
    const multiplier = unitType === 'g-ml' ? 100 : 1
    const computed = items.map((item) => {
      const totalUnits = Math.max(0.0001, item.quantity * Math.max(1, item.packs))
      const unitCost = (Math.max(0, item.price) / totalUnits) * multiplier
      return {
        ...item,
        totalUnits,
        unitCost,
      }
    })

    const validCosts = computed
      .filter((c) => c.price > 0 && c.quantity > 0)
      .map((c) => c.unitCost)

    const minCost = validCosts.length > 0 ? Math.min(...validCosts) : 0
    const maxCost = validCosts.length > 0 ? Math.max(...validCosts) : 0

    const savingsPercent =
      maxCost > minCost && maxCost > 0
        ? ((maxCost - minCost) / maxCost) * 100
        : 0

    return {
      computed,
      minCost,
      savingsPercent,
    }
  }, [items, unitType])

  function updateItem(
    id: string,
    patch: Partial<Omit<ProductCompareItem, 'id'>>,
  ) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  function addItem() {
    if (items.length >= 4) return
    const nextIdx = items.length + 1
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: `Produk ${String.fromCharCode(64 + nextIdx)}`,
        price: 30000,
        quantity: 500,
        packs: 1,
      },
    ])
  }

  function removeItem(id: string) {
    if (items.length <= 2) return
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="discount-calculator" />

      {/* Segmented Mode Switcher */}
      <div className="mt-6 flex">
        <div className="ios-segmented inline-flex">
          <button
            type="button"
            onClick={() => setActiveTab('discount')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
              activeTab === 'discount'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Percent size={14} />
            {t('Hitung Diskon Bertingkat (50%+20%)', 'Double Discount & Tax')}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
              activeTab === 'compare'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Scale size={14} />
            {t('Bandingkan Harga Minimarket', 'Compare Unit Value')}
          </button>
        </div>
      </div>

      {activeTab === 'discount' ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* Discount Form */}
          <section className="ios-card space-y-4 p-5 sm:p-6">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              {t('Rincian Harga & Diskon', 'Price & Discount Details')}
            </h2>

            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>{t('Harga Awal Sebelum Diskon', 'Original Price')}</span>
                <span className="text-[var(--primary)]">
                  {formatRupiah(originalPrice)}
                </span>
              </div>
              <input
                type="number"
                min={0}
                step={5000}
                value={originalPrice}
                onChange={(e) =>
                  setOriginalPrice(Math.max(0, Number(e.target.value)))
                }
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>{t('Diskon Utama (%)', 'First Discount (%)')}</span>
                <span className="text-[var(--primary)]">{discount1}%</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[10, 15, 20, 25, 30, 50, 70].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscount1(d)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                      discount1 === d
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                        : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={discount1}
                onChange={(e) =>
                  setDiscount1(
                    Math.max(0, Math.min(100, Number(e.target.value))),
                  )
                }
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>
                  {t(
                    'Diskon Tambahan Kedua (+ %)',
                    'Extra Stacked Discount (+ %)',
                  )}
                </span>
                <span className="text-[var(--primary)]">+{discount2}%</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[0, 5, 10, 15, 20, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscount2(d)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                      discount2 === d
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                        : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                    }`}
                  >
                    +{d}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)]">
                {t(
                  'Potongan Voucher / Cashback Tambahan (Rp)',
                  'Extra Voucher / Cashback Deduction (Rp)',
                )}
              </label>
              <input
                type="number"
                min={0}
                step={5000}
                value={voucherOff}
                onChange={(e) =>
                  setVoucherOff(Math.max(0, Number(e.target.value)))
                }
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-3">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {t('Tambahkan Pajak PPN 11%', 'Add 11% VAT / PPN Tax')}
              </span>
              <input
                type="checkbox"
                checked={includePpn}
                onChange={(e) => setIncludePpn(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
            </label>
          </section>

          {/* Discount Output Card */}
          <section className="ios-card flex flex-col justify-between p-5 sm:p-6">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t('Ringkasan Harga Akhir', 'Final Price Breakdown')}
                </h2>
                <ShoppingBag size={18} className="text-[var(--primary)]" />
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)]/60 p-6 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                  {t('Harga Akhir yang Dibayar', 'Final Amount to Pay')}
                </p>
                <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                  {formatRupiah(discountResult.finalPay)}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t('Total Hemat:', 'You Save:')}{' '}
                  {formatRupiah(discountResult.totalSaved)} (
                  {discountResult.effectiveDiscountPct.toFixed(1)}%)
                </p>
              </div>

              <div className="mt-5 space-y-2.5 text-xs">
                <div className="flex justify-between rounded-xl bg-[var(--surface-soft)] px-4 py-2.5">
                  <span className="text-[var(--text-secondary)]">
                    {t('Harga Normal Awal', 'Original Price')}
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {formatRupiah(originalPrice)}
                  </span>
                </div>

                <div className="flex justify-between rounded-xl bg-[var(--surface-soft)] px-4 py-2.5">
                  <span className="text-[var(--text-secondary)]">
                    {t(
                      `Setelah Diskon Pertama (${discount1}%)`,
                      `After First Discount (${discount1}%)`,
                    )}
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {formatRupiah(discountResult.afterD1)}
                  </span>
                </div>

                {discount2 > 0 && (
                  <div className="flex justify-between rounded-xl bg-[var(--surface-soft)] px-4 py-2.5">
                    <span className="text-[var(--text-secondary)]">
                      {t(
                        `Setelah Diskon Tambahan (+${discount2}%)`,
                        `After Second Discount (+${discount2}%)`,
                      )}
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {formatRupiah(discountResult.afterD2)}
                    </span>
                  </div>
                )}

                {includePpn && (
                  <div className="flex justify-between rounded-xl bg-[var(--surface-soft)] px-4 py-2.5">
                    <span className="text-[var(--text-secondary)]">
                      {t('Pajak PPN (11%)', 'VAT Tax (11%)')}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      +{formatRupiah(discountResult.taxAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {discount2 > 0 && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 text-xs leading-5 text-[var(--text-secondary)]">
                💡{' '}
                <strong>
                  {t('Fakta Diskon Bertingkat:', 'Stacked Discount Fact:')}
                </strong>{' '}
                {t(
                  `Label diskon "${discount1}% + ${discount2}%" bukan berarti diskon ${discount1 + discount2}%, melainkan diskon kedua dihitung dari sisa harga setelah diskon pertama (setara diskon murni ${(100 - (100 - discount1) * (1 - discount2 / 100)).toFixed(1)}%).`,
                  `A "${discount1}% + ${discount2}%" tag does not equal ${discount1 + discount2}% off — the second discount applies to the already-reduced price (equivalent to ${(100 - (100 - discount1) * (1 - discount2 / 100)).toFixed(1)}% total off).`,
                )}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Unit Price Comparator */}
          <div className="ios-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {t(
                    'Bandingkan Mana Kemasan yang Lebih Murah',
                    'Compare Which Package Gives Better Value',
                  )}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  {t(
                    'Masukkan harga dan berat/isi bersih (gram, ml, atau jumlah pcs) untuk melihat mana yang paling hemat.',
                    'Enter price and net weight/volume (grams, ml, or pieces) to find the cheapest unit cost.',
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="ios-segmented inline-flex">
                  <button
                    type="button"
                    onClick={() => setUnitType('g-ml')}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                      unitType === 'g-ml'
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('Berat / Volume (per 100g/ml)', 'Per 100g / 100ml')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitType('pcs')}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                      unitType === 'pcs'
                        ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {t('Jumlah Isi (per 1 pcs)', 'Per 1 Piece')}
                  </button>
                </div>

                {items.length < 4 && (
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
                  >
                    <Plus size={14} />
                    {t('Tambah Produk', 'Add Item')}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {compareAnalysis.computed.map((item) => {
                const isWinner =
                  compareAnalysis.minCost > 0 &&
                  Math.abs(item.unitCost - compareAnalysis.minCost) < 0.01

                return (
                  <div
                    key={item.id}
                    className={`relative rounded-2xl border p-4 transition ${
                      isWinner
                        ? 'border-emerald-500/60 bg-emerald-500/5 ring-2 ring-emerald-500/20'
                        : 'border-[var(--border)] bg-[var(--surface-soft)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          updateItem(item.id, { name: e.target.value })
                        }
                        className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--text-primary)] outline-none focus:underline"
                      />

                      {isWinner && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                          <Award size={12} />
                          {t('PALING HEMAT', 'BEST VALUE')}
                        </span>
                      )}

                      {items.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)]">
                          {t('Harga Produk (Rp)', 'Price (Rp)')}
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, {
                              price: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[var(--text-muted)]">
                          {unitType === 'g-ml'
                            ? t('Berat / Isi (gram atau ml)', 'Net Weight (g / ml)')
                            : t('Jumlah Isi (pcs / lembar)', 'Quantity (pcs)')}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, {
                              quantity: Math.max(1, Number(e.target.value)),
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5 text-xs">
                      <span className="text-[var(--text-secondary)]">
                        {unitType === 'g-ml'
                          ? t('Harga per 100g / 100ml:', 'Cost per 100g / 100ml:')
                          : t('Harga per 1 pcs:', 'Cost per 1 piece:')}
                      </span>
                      <span
                        className={`font-bold ${
                          isWinner
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {formatRupiah(item.unitCost)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {compareAnalysis.savingsPercent > 0.1 && (
              <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300">
                🏆{' '}
                {t(
                  `Pilihan berlabel PALING HEMAT lebih murah ${compareAnalysis.savingsPercent.toFixed(1)}% per satuan isi dibanding opsi yang paling mahal!`,
                  `The BEST VALUE option is ${compareAnalysis.savingsPercent.toFixed(1)}% cheaper per unit than the pricier package!`,
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
