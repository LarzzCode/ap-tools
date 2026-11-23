import { useMemo, useState } from 'react'
import {
  Calculator,
  Check,
  Copy,
  Info,
  Table,
} from 'lucide-react'

import ToolPageHeader from '../../components/tools/ToolPageHeader'
import { useLanguage } from '../../hooks/useLanguage'

type InterestMethod = 'flat' | 'annuity' | 'sliding'

interface AmortizationRow {
  month: number
  installment: number
  principalPart: number
  interestPart: number
  remainingBalance: number
}

function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`
}

// Compute equivalent annual annuity interest rate from a given principal, months, and fixed monthly payment
function estimateEquivalentEffectiveRate(
  principal: number,
  months: number,
  monthlyPayment: number,
): number {
  if (principal <= 0 || months <= 0 || monthlyPayment * months <= principal) {
    return 0
  }

  let low = 0
  let high = 2.0 // 200% annual
  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2
    const r = mid / 12
    const pmt =
      r === 0
        ? principal / months
        : (principal * r) / (1 - Math.pow(1 + r, -months))
    if (pmt < monthlyPayment) {
      low = mid
    } else {
      high = mid
    }
  }
  return ((low + high) / 2) * 100
}

export default function LoanCalculator() {
  const { language, t } = useLanguage()

  const [totalPrice, setTotalPrice] = useState(150000000)
  const [downPayment, setDownPayment] = useState(30000000)
  const [months, setMonths] = useState(36)
  const [annualRate, setAnnualRate] = useState(10)
  const [method, setMethod] = useState<InterestMethod>('flat')
  const [showSchedule, setShowSchedule] = useState(false)
  const [copied, setCopied] = useState(false)

  const principal = Math.max(0, totalPrice - downPayment)

  const calculation = useMemo(() => {
    const n = Math.max(1, Math.min(360, months))
    const rateDecimal = Math.max(0, annualRate) / 100
    const monthlyRate = rateDecimal / 12

    const schedule: AmortizationRow[] = []
    let balance = principal
    let totalInterest = 0
    let totalPaid = 0

    if (method === 'flat') {
      const principalPerMonth = principal / n
      const interestPerMonth = principal * monthlyRate
      const installment = principalPerMonth + interestPerMonth

      for (let m = 1; m <= n; m++) {
        balance = Math.max(0, balance - principalPerMonth)
        totalInterest += interestPerMonth
        totalPaid += installment
        schedule.push({
          month: m,
          installment,
          principalPart: principalPerMonth,
          interestPart: interestPerMonth,
          remainingBalance: balance,
        })
      }
    } else if (method === 'annuity') {
      const installment =
        monthlyRate === 0
          ? principal / n
          : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n))

      for (let m = 1; m <= n; m++) {
        const interestPart = balance * monthlyRate
        const principalPart = Math.min(balance, installment - interestPart)
        balance = Math.max(0, balance - principalPart)
        totalInterest += interestPart
        totalPaid += principalPart + interestPart
        schedule.push({
          month: m,
          installment: principalPart + interestPart,
          principalPart,
          interestPart,
          remainingBalance: balance,
        })
      }
    } else {
      // Sliding effective
      const principalPerMonth = principal / n
      for (let m = 1; m <= n; m++) {
        const interestPart = balance * monthlyRate
        const installment = principalPerMonth + interestPart
        balance = Math.max(0, balance - principalPerMonth)
        totalInterest += interestPart
        totalPaid += installment
        schedule.push({
          month: m,
          installment,
          principalPart: principalPerMonth,
          interestPart,
          remainingBalance: balance,
        })
      }
    }

    const firstInstallment = schedule[0]?.installment ?? 0
    const lastInstallment = schedule[schedule.length - 1]?.installment ?? 0

    // Equivalent rate insight
    const equivalentEffective =
      method === 'flat'
        ? estimateEquivalentEffectiveRate(principal, n, firstInstallment)
        : annualRate

    const equivalentFlat =
      n > 0 && principal > 0
        ? (totalInterest / principal / (n / 12)) * 100
        : 0

    return {
      schedule,
      firstInstallment,
      lastInstallment,
      totalInterest,
      totalPaid,
      equivalentEffective,
      equivalentFlat,
    }
  }, [principal, months, annualRate, method])

  async function handleCopySummary() {
    const methodLabel =
      method === 'flat'
        ? 'Bunga Flat'
        : method === 'annuity'
          ? 'Bunga Efektif (Anuitas)'
          : 'Bunga Efektif (Sliding)'

    const text = [
      `📊 *SIMULASI CICILAN & PINJAMAN*`,
      `• Harga / Plafon: ${formatRupiah(totalPrice)}`,
      `• Uang Muka (DP): ${formatRupiah(downPayment)}`,
      `• Pokok Pinjaman: ${formatRupiah(principal)}`,
      `• Tenor: ${months} Bulan (${(months / 12).toFixed(1)} Tahun)`,
      `• Bunga: ${annualRate}% / tahun (${methodLabel})`,
      ``,
      `💳 *Cicilan per Bulan:* ${
        method === 'sliding'
          ? `${formatRupiah(calculation.firstInstallment)} (Bln 1) s/d ${formatRupiah(calculation.lastInstallment)} (Bln ${months})`
          : formatRupiah(calculation.firstInstallment)
      }`,
      `• Total Bunga Dibayar: ${formatRupiah(calculation.totalInterest)}`,
      `• Total Seluruh Pembayaran: ${formatRupiah(calculation.totalPaid)}`,
      `— Dihitung via Ditya Tools`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <ToolPageHeader toolId="loan-calculator" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* Left: Loan Parameters */}
        <section className="ios-card h-fit space-y-4 p-5 sm:p-6">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {t('Parameter Pinjaman / Kredit', 'Loan Parameters')}
          </h2>

          {/* Method Switcher */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('Sistem Perhitungan Bunga', 'Interest Calculation Method')}
            </label>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(
                [
                  ['flat', t('Bunga Flat', 'Flat Rate')],
                  ['annuity', t('Anuitas (KPR)', 'Annuity')],
                  ['sliding', t('Efektif Menurun', 'Sliding')],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    method === id
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Total Price */}
          <div>
            <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
              <span>
                {t('Harga Barang / Total Pinjaman', 'Asset Price / Loan Amount')}
              </span>
              <span className="text-[var(--primary)]">
                {formatRupiah(totalPrice)}
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={1000000}
              value={totalPrice}
              onChange={(e) => setTotalPrice(Math.max(0, Number(e.target.value)))}
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
            />
          </div>

          {/* Down Payment */}
          <div>
            <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
              <span>
                {t('Uang Muka / DP (Isi 0 jika Pinjaman Tunai)', 'Down Payment (0 for Cash Loan)')}
              </span>
              <span className="text-[var(--text-muted)]">
                {totalPrice > 0
                  ? `${Math.round((downPayment / totalPrice) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <input
              type="number"
              min={0}
              step={500000}
              value={downPayment}
              onChange={(e) =>
                setDownPayment(Math.max(0, Number(e.target.value)))
              }
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
            />
          </div>

          {/* Tenor in Months */}
          <div>
            <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
              <span>{t('Tenor (Lama Cicilan)', 'Loan Term (Months)')}</span>
              <span className="text-[var(--primary)]">
                {months} {t('Bulan', 'Months')} ({(months / 12).toFixed(1)}{' '}
                {t('Thn', 'Yrs')})
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {[12, 24, 36, 60, 120, 180].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                    months === m
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]'
                  }`}
                >
                  {m} {t('Bln', 'Mo')}
                </button>
              ))}
            </div>

            <input
              type="number"
              min={1}
              max={360}
              value={months}
              onChange={(e) =>
                setMonths(Math.max(1, Math.min(360, Number(e.target.value))))
              }
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
            />
          </div>

          {/* Annual Interest Rate */}
          <div>
            <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
              <span>
                {t('Suku Bunga per Tahun (% p.a.)', 'Annual Interest Rate (% p.a.)')}
              </span>
              <span className="text-[var(--primary)]">{annualRate}% / thn</span>
            </div>
            <input
              type="number"
              min={0}
              max={100}
              step={0.25}
              value={annualRate}
              onChange={(e) =>
                setAnnualRate(Math.max(0, Number(e.target.value)))
              }
              className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-border)]"
            />
          </div>
        </section>

        {/* Right: Results, Flat vs Effective Comparison & Amortization Table */}
        <section className="space-y-5">
          <div className="ios-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-[var(--primary)]" />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  {t('Hasil Simulasi Angsuran', 'Installment Summary')}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => void handleCopySummary()}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--primary-border)] bg-[var(--primary-soft)] px-3.5 py-1.5 text-xs font-bold text-[var(--primary)] transition hover:opacity-90"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied
                  ? t('Tersalin ke WA!', 'Copied!')
                  : t('Salin Ringkasan WA', 'Copy Summary')}
              </button>
            </div>

            {/* Primary Monthly Installment Highlight */}
            <div className="mt-4 rounded-2xl border border-[var(--primary-border)] bg-[var(--primary-soft)]/60 p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                {method === 'sliding'
                  ? t('Cicilan Bulan Pertama → Terakhir', 'First → Last Month Installment')
                  : t('Estimasi Cicilan Tetap per Bulan', 'Fixed Monthly Installment')}
              </p>
              <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {method === 'sliding'
                  ? `${formatRupiah(calculation.firstInstallment)} → ${formatRupiah(calculation.lastInstallment)}`
                  : formatRupiah(calculation.firstInstallment)}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {t('Pokok Pinjaman Bersih:', 'Net Loan Principal:')}{' '}
                <strong className="text-[var(--text-primary)]">
                  {formatRupiah(principal)}
                </strong>
              </p>
            </div>

            {/* Breakdown Cards */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
                <p className="text-[11px] font-bold text-[var(--text-muted)]">
                  {t('Total Pokok Pinjaman', 'Net Principal')}
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
                  {formatRupiah(principal)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
                <p className="text-[11px] font-bold text-[var(--text-muted)]">
                  {t('Total Bunga Dibayar', 'Total Interest Paid')}
                </p>
                <p className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                  {formatRupiah(calculation.totalInterest)}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5">
                <p className="text-[11px] font-bold text-[var(--text-muted)]">
                  {t('Total Seluruh Bayar', 'Total Cumulative Paid')}
                </p>
                <p className="mt-1 text-sm font-bold text-[var(--primary)]">
                  {formatRupiah(calculation.totalPaid)}
                </p>
              </div>
            </div>

            {/* Flat vs Effective Equivalence Insight Box */}
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
              <Info
                size={17}
                className="mt-0.5 shrink-0 text-[var(--primary)]"
              />
              <div className="text-xs leading-5 text-[var(--text-secondary)]">
                <p className="font-bold text-[var(--text-primary)]">
                  {t(
                    'Perbandingan Bunga Flat vs Bunga Efektif:',
                    'Flat vs Effective Interest Equivalence:',
                  )}
                </p>
                {method === 'flat' ? (
                  <p className="mt-0.5">
                    {language === 'id'
                      ? `Bunga Flat ${annualRate}%/tahun selama ${months} bulan memiliki beban cicilan yang setara dengan Bunga Efektif (Anuitas) sekitar ${calculation.equivalentEffective.toFixed(2)}%/tahun.`
                      : `A Flat Rate of ${annualRate}%/yr over ${months} months carries the same payment cost as an Effective Annuity Rate of ~${calculation.equivalentEffective.toFixed(2)}%/yr.`}
                  </p>
                ) : (
                  <p className="mt-0.5">
                    {language === 'id'
                      ? `Bunga Efektif ${annualRate}%/tahun selama ${months} bulan menghasilkan total bunga yang setara dengan Bunga Flat sekitar ${calculation.equivalentFlat.toFixed(2)}%/tahun.`
                      : `An Effective Rate of ${annualRate}%/yr over ${months} months equals a Flat Rate of ~${calculation.equivalentFlat.toFixed(2)}%/yr.`}
                  </p>
                )}
              </div>
            </div>

            {/* Toggle Amortization Schedule */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowSchedule((prev) => !prev)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-[var(--primary-border)]"
              >
                <Table size={14} className="text-[var(--primary)]" />
                {showSchedule
                  ? t(
                      'Sembunyikan Tabel Rincian Angsuran Bulanan',
                      'Hide Monthly Amortization Schedule',
                    )
                  : t(
                      `Lihat Tabel Rincian Angsuran (${months} Bulan)`,
                      `View Monthly Amortization Schedule (${months} Months)`,
                    )}
              </button>

              {showSchedule && (
                <div className="mt-3 max-h-80 overflow-auto rounded-2xl border border-[var(--border)]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[var(--surface-soft)] text-[11px] font-bold text-[var(--text-secondary)]">
                      <tr>
                        <th className="px-3 py-2.5">{t('Bln', 'Mo')}</th>
                        <th className="px-3 py-2.5">{t('Cicilan', 'Payment')}</th>
                        <th className="px-3 py-2.5">{t('Pokok', 'Principal')}</th>
                        <th className="px-3 py-2.5">{t('Bunga', 'Interest')}</th>
                        <th className="px-3 py-2.5">
                          {t('Sisa Hutang', 'Balance')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {calculation.schedule.map((row) => (
                        <tr key={row.month}>
                          <td className="px-3 py-2 font-bold text-[var(--text-muted)]">
                            #{row.month}
                          </td>
                          <td className="px-3 py-2 font-semibold text-[var(--text-primary)]">
                            {formatRupiah(row.installment)}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-secondary)]">
                            {formatRupiah(row.principalPart)}
                          </td>
                          <td className="px-3 py-2 text-amber-600 dark:text-amber-400">
                            {formatRupiah(row.interestPart)}
                          </td>
                          <td className="px-3 py-2 text-[var(--text-secondary)]">
                            {formatRupiah(row.remainingBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
