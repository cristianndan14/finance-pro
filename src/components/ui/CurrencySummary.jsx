import { TrendingUp, Loader2, Wallet } from 'lucide-react'
import { useTransactions } from '../../hooks/useTransactions'

export default function CurrencySummary({ accounts }) {
    const { transactions, loading: txLoading } = useTransactions()

    const realBalances = accounts.reduce((acc, account) => {
        const currency = account.currency || 'ARS'
        acc[currency] = (acc[currency] || 0) + (account.current_balance || 0)
        return acc
    }, {})

    const now = new Date()
    const futureDebtByCurrency = transactions.reduce((acc, t) => {
        const txDate = new Date(t.created_at)
        if (txDate > now && (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear())) {
            const currency = t.currency || 'ARS'
            acc[currency] = (acc[currency] || 0) + (t.amount || 0)
        }
        return acc
    }, {})

    const currencies = Object.keys(realBalances)

    if (currencies.length === 0) {
        return (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="opacity-80" />
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Resumen Patrimonial</p>
                </div>
                <p className="text-4xl font-extrabold tracking-tight">$ 0,00</p>
            </div>
        )
    }

    return (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white mb-6 shadow-xl relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-900/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="opacity-75" />
                        <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Resumen Patrimonial</p>
                    </div>
                    {txLoading && <Loader2 size={13} className="animate-spin opacity-50" />}
                </div>

                {currencies.map((currency, idx) => {
                    const real = realBalances[currency] || 0
                    const futureDebt = futureDebtByCurrency[currency] || 0
                    const monthly = real + futureDebt

                    const fmt = (val) =>
                        new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(val)

                    return (
                        <div
                            key={currency}
                            className={idx < currencies.length - 1 ? 'border-b border-white/10 pb-5 mb-5' : ''}
                        >
                            {/* Currency badge */}
                            <span className="inline-block text-[10px] font-bold tracking-widest bg-white/15 border border-white/20 px-2 py-0.5 rounded-full mb-3">
                                {currency}
                            </span>

                            {/* PRIMARY metric — hero size */}
                            <div className="mb-1">
                                <p className="text-[11px] font-medium uppercase tracking-widest opacity-60 mb-1">
                                    Patrimonio Real
                                </p>
                                <p className="text-4xl font-extrabold tracking-tight leading-none">
                                    {fmt(real)}
                                </p>
                            </div>

                            {/* SECONDARY metric — subordinate pill */}
                            <div className="mt-4 inline-flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2.5 border border-white/10">
                                <Wallet size={14} className="opacity-60 shrink-0" />
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60 leading-none mb-1">
                                        Liquidez mensual
                                    </p>
                                    <p className="text-base font-bold text-blue-100 leading-none">
                                        {fmt(monthly)}
                                    </p>
                                </div>
                            </div>

                            {futureDebt > 0 && (
                                <p className="text-[10px] text-blue-200/70 italic mt-2.5">
                                    * Sin {fmt(futureDebt)} en cuotas futuras
                                </p>
                            )}
                        </div>
                    )
                })}

                {/* Footer */}
                <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <p className="text-[11px] opacity-60">
                        {accounts.length} cuenta{accounts.length !== 1 ? 's' : ''} activa{accounts.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        </div>
    )
}
