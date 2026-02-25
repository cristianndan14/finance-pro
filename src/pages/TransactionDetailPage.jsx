import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
    ArrowLeft, Loader2, ArrowRightLeft, TrendingUp, TrendingDown,
    Tag, Wallet, BookOpen, Calendar, FileText, Hash, User, CreditCard
} from 'lucide-react'

export default function TransactionDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [transaction, setTransaction] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchTransaction = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select(`
                        *,
                        category:categories(name, color, icon),
                        account:accounts!account_id(name, currency, type),
                        transfer_target:accounts!transfer_target_id(name, currency, type),
                        budget:budgets(name),
                        user:profiles!user_id(full_name, email)
                    `)
                    .eq('id', id)
                    .single()

                if (error) throw error
                setTransaction(data)
            } catch (err) {
                console.error('Error fetching transaction:', err)
                setError(err.message || 'No se pudo cargar la transacción')
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchTransaction()
    }, [id])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !transaction) {
        return (
            <div className="p-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-4">
                    <ArrowLeft size={18} /> Volver
                </button>
                <p className="text-red-500">{error || 'Transacción no encontrada.'}</p>
            </div>
        )
    }

    const t = transaction
    const isTransfer = t.is_transfer
    const isIncome = !isTransfer && t.type === 'ingreso'
    const isExpense = !isTransfer && t.type === 'egreso'

    // Gradient and color based on transaction type
    const gradientClass = isTransfer
        ? 'from-indigo-500 to-blue-600'
        : isIncome
            ? 'from-green-500 to-emerald-600'
            : 'from-red-500 to-rose-600'

    const amountPrefix = isTransfer ? '' : isIncome ? '+' : '-'
    const currency = t.account?.currency || t.currency || 'ARS'

    const formattedAmount = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
    }).format(t.amount)

    const formattedDate = new Date(t.created_at).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    const formattedTime = new Date(t.created_at).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    // Label for the hero
    let typeLabel = ''
    if (isTransfer) {
        typeLabel = 'Transferencia'
    } else if (isIncome) {
        typeLabel = 'Ingreso'
    } else {
        typeLabel = 'Egreso'
    }

    // Clean description (remove installment suffix)
    const cleanDesc = t.description?.replace(/\s\(Cuota\s\d+\/\d+\)$/, '') || ''
    const showDesc = cleanDesc && cleanDesc !== 'Compra en cuotas'

    return (
        <div className="p-4 pb-24 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Detalle</h1>
            </div>

            {/* Hero card */}
            <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-6 text-white mb-6 shadow-lg`}>
                <div className="flex items-center gap-2 mb-3">
                    {isTransfer
                        ? <ArrowRightLeft size={18} className="opacity-80" />
                        : isIncome
                            ? <TrendingUp size={18} className="opacity-80" />
                            : <TrendingDown size={18} className="opacity-80" />
                    }
                    <span className="text-sm font-medium uppercase tracking-wider opacity-90">{typeLabel}</span>
                </div>
                <p className="text-4xl font-bold tracking-tight">
                    {amountPrefix}{formattedAmount}
                </p>
                <p className="text-sm opacity-75 mt-2">
                    {formattedDate} · {formattedTime}
                </p>

                {/* Transfer accounts inline in hero */}
                {isTransfer && (
                    <div className="mt-4 flex items-center gap-2 bg-white/15 rounded-xl px-4 py-3 text-sm font-medium">
                        <Wallet size={14} className="opacity-80 flex-shrink-0" />
                        <span className="truncate">{t.account?.name || 'Origen'}</span>
                        <ArrowRightLeft size={14} className="opacity-70 flex-shrink-0" />
                        <span className="truncate">{t.transfer_target?.name || 'Destino'}</span>
                    </div>
                )}

                {/* Installments badge */}
                {t.installments_count > 1 && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                        <Hash size={12} />
                        Cuota {t.installment_number}/{t.installments_count}
                    </div>
                )}
            </div>

            {/* Details list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">

                {/* Category */}
                {t.category && (
                    <div className="flex items-center gap-4 p-4">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Tag size={16} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Categoría</p>
                            <p className="font-semibold text-gray-900">{t.category.name}</p>
                        </div>
                    </div>
                )}

                {/* Description */}
                {showDesc && (
                    <div className="flex items-center gap-4 p-4">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <FileText size={16} className="text-gray-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Descripción</p>
                            <p className="font-semibold text-gray-900">{cleanDesc}</p>
                        </div>
                    </div>
                )}

                {/* Account */}
                {t.account && (
                    <div className="flex items-center gap-4 p-4">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            {t.account.type === 'credit'
                                ? <CreditCard size={16} className="text-blue-600" />
                                : <Wallet size={16} className="text-blue-600" />
                            }
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                {isTransfer ? 'Cuenta origen' : 'Cuenta'}
                            </p>
                            <p className="font-semibold text-gray-900">{t.account.name}</p>
                        </div>
                    </div>
                )}

                {/* Transfer target */}
                {isTransfer && t.transfer_target && (
                    <div className="flex items-center gap-4 p-4">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            {t.transfer_target.type === 'credit'
                                ? <CreditCard size={16} className="text-indigo-600" />
                                : <Wallet size={16} className="text-indigo-600" />
                            }
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Cuenta destino</p>
                            <p className="font-semibold text-gray-900">{t.transfer_target.name}</p>
                        </div>
                    </div>
                )}

                {/* Budget */}
                {t.budget && (
                    <div className="flex items-center gap-4 p-4">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Presupuesto</p>
                            <p className="font-semibold text-gray-900">{t.budget.name}</p>
                        </div>
                    </div>
                )}

                {/* Date */}
                <div className="flex items-center gap-4 p-4">
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <Calendar size={16} className="text-teal-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Fecha</p>
                        <p className="font-semibold text-gray-900 capitalize">{formattedDate}</p>
                        <p className="text-xs text-gray-400">{formattedTime}</p>
                    </div>
                </div>

                {/* User / author */}
                {t.user && (
                    <div className="flex items-center gap-4 p-4">
                        <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-rose-500" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Registrado por</p>
                            <p className="font-semibold text-gray-900">
                                {t.user.full_name || t.user.email}
                            </p>
                        </div>
                    </div>
                )}

                {/* Currency */}
                <div className="flex items-center gap-4 p-4">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-green-700">{currency}</span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Moneda</p>
                        <p className="font-semibold text-gray-900">{currency}</p>
                    </div>
                </div>
            </div>

            {/* ID footer */}
            <p className="text-center text-xs text-gray-300 mt-6 font-mono">{t.id}</p>
        </div>
    )
}
