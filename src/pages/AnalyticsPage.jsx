import { useAnalytics } from '../hooks/useAnalytics'
import {
    ArrowLeft, Loader2, TrendingUp, TrendingDown,
    BarChart3, Wallet, Sparkles, Tag
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area,
    ReferenceLine
} from 'recharts'

const CURRENCY_LABELS = { ARS: '🇦🇷 ARS', USD: '🇺🇸 USD', EUR: '🇪🇺 EUR', GBP: '🇬🇧 GBP', BRL: '🇧🇷 BRL' }


const PALETTE = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'
]

const fmt = (val) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val)

const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
                    {p.name}: {fmt(p.value)}
                </p>
            ))}
        </div>
    )
}

const CustomAreaTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const val = payload[0].value
    const isPos = val >= 0
    return (
        <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-xs">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            <p className={`font-bold ${isPos ? 'text-emerald-600' : 'text-rose-500'}`}>
                {isPos ? '+' : ''}{fmt(val)}
            </p>
        </div>
    )
}

export default function AnalyticsPage() {
    const navigate = useNavigate()
    const { loading, monthlyStats, expensesByCategory, kpis } = useAnalytics()

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    const savingsRateClamped = Math.max(0, Math.min(100, kpis.savingsRate))
    const isPositive = kpis.netSavings >= 0
    const totalCategoryExpenses = expensesByCategory.reduce((s, c) => s + c.value, 0)

    // Derive net savings per month for the area chart
    const netSavingsData = monthlyStats.map(m => ({
        shortName: m.shortName,
        net: m.income - m.expense,
    }))

    return (
        <div className="p-4 pb-24 max-w-lg mx-auto">

            {/* ——— Header ——— */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
                    <p className="text-sm text-gray-500">Resumen del mes actual</p>
                </div>
            </div>

            {/* ——— Hero: Savings Rate ——— */}
            <div className={`rounded-2xl p-6 text-white mb-6 shadow-lg ${isPositive
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                : 'bg-gradient-to-br from-rose-500 to-red-600'
                }`}>
                <div className="flex items-center gap-2 mb-1 opacity-90">
                    <Sparkles size={16} />
                    <span className="text-sm font-medium uppercase tracking-wider">Tasa de Ahorro</span>
                </div>
                <p className="text-5xl font-bold mb-4">{kpis.savingsRate.toFixed(1)}%</p>
                <div className="mb-3">
                    <div className="h-2.5 bg-white/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-700"
                            style={{ width: `${savingsRateClamped}%` }}
                        />
                    </div>
                </div>
                <p className="text-sm opacity-80">
                    {isPositive ? '✓ Superávit' : '✕ Déficit'} de{' '}
                    <span className="font-semibold">{fmt(Math.abs(kpis.netSavings))}</span> este mes
                </p>
            </div>

            {/* ——— KPI Row ——— */}
            <div className="grid grid-cols-3 gap-3 mb-6">

                {/* Per-currency balances */}
                {Object.entries(kpis.balanceByCurrency).map(([currency, balance]) => {
                    const fmtCur = (val) => new Intl.NumberFormat('es-AR', {
                        style: 'currency', currency, maximumFractionDigits: 2
                    }).format(val)
                    return (
                        <div
                            key={currency}
                            className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-1"
                        >
                            <div className="flex items-center gap-1.5">
                                <Wallet size={13} className="text-indigo-500" />
                                <span className="text-xs text-gray-500 font-medium">
                                    {CURRENCY_LABELS[currency] ?? currency}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 leading-tight break-all">{fmtCur(balance)}</p>
                        </div>
                    )
                })}

                {/* Ingresos / Gastos / Net — always 3-col row */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 shadow-sm col-span-1 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-green-600" />
                        <span className="text-xs text-green-700 font-medium">Ingresos</span>
                    </div>
                    <p className="text-base font-bold text-green-800 leading-tight">{fmt(kpis.totalIncome)}</p>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm col-span-1 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <TrendingDown size={14} className="text-red-600" />
                        <span className="text-xs text-red-700 font-medium">Gastos</span>
                    </div>
                    <p className="text-base font-bold text-red-800 leading-tight">{fmt(kpis.totalExpense)}</p>
                </div>

                <div className={`border rounded-xl p-4 shadow-sm col-span-1 flex flex-col gap-1 ${isPositive ? 'bg-violet-50 border-violet-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className="flex items-center gap-1.5">
                        <Sparkles size={14} className={isPositive ? 'text-violet-600' : 'text-orange-500'} />
                        <span className={`text-xs font-medium ${isPositive ? 'text-violet-700' : 'text-orange-700'}`}>
                            {isPositive ? 'Superávit' : 'Déficit'}
                        </span>
                    </div>
                    <p className={`text-base font-bold leading-tight ${isPositive ? 'text-violet-800' : 'text-orange-800'}`}>
                        {fmt(Math.abs(kpis.netSavings))}
                    </p>
                </div>
            </div>

            {/* ——— Chart 1: Income vs Expense (bar) ——— */}
            {monthlyStats.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <BarChart3 size={18} className="text-indigo-500" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Ingresos vs Gastos</h2>
                            <p className="text-xs text-gray-400">Últimos 6 meses</p>
                        </div>
                    </div>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyStats} barCategoryGap="30%" barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="shortName"
                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={40}
                                />
                                <Tooltip content={<CustomBarTooltip />} />
                                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Ingresos
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Gastos
                        </span>
                    </div>
                </div>
            )}

            {/* ——— Chart 2: Net Savings trend (area) ——— */}
            {netSavingsData.length > 1 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <TrendingUp size={18} className="text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Flujo Neto Mensual</h2>
                            <p className="text-xs text-gray-400">Ingresos − Gastos por mes</p>
                        </div>
                    </div>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={netSavingsData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="netGreen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="netRed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="shortName"
                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={40}
                                />
                                <Tooltip content={<CustomAreaTooltip />} />
                                <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1.5} />
                                <Area
                                    type="monotone"
                                    dataKey="net"
                                    name="Flujo neto"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fill="url(#netGreen)"
                                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ——— Chart 3: Category ranked list ——— */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                        <Tag size={18} className="text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Gastos por Categoría</h2>
                        <p className="text-xs text-gray-400">Mes actual</p>
                    </div>
                </div>

                {expensesByCategory.length > 0 ? (
                    <div className="space-y-3">
                        {expensesByCategory.map((cat, i) => {
                            const pct = totalCategoryExpenses > 0
                                ? (cat.value / totalCategoryExpenses) * 100
                                : 0
                            const color = PALETTE[i % PALETTE.length]
                            return (
                                <div key={cat.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-sm text-gray-700 font-medium">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">{fmt(cat.value)}</span>
                                            <span className="text-xs text-gray-400 ml-1.5">{pct.toFixed(0)}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%`, backgroundColor: color }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                        <Tag size={28} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No hay gastos este mes</p>
                    </div>
                )}
            </div>
        </div>
    )
}
