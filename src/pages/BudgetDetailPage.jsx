import { useParams, useNavigate } from 'react-router-dom'
import { useBudgets } from '../hooks/useBudgets'
import { useTransactions } from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import {
    ArrowLeft, Loader2, TrendingDown, TrendingUp, Edit2, Trash2,
    UserPlus, User, Wallet, PiggyBank, Receipt
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import CreateBudgetForm from '../components/ui/CreateBudgetForm'
import ShareModal from '../components/ui/ShareModal'
import { supabase } from '../lib/supabaseClient'

export default function BudgetDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { budgets, loading: budgetsLoading, updateBudget, deleteBudget } = useBudgets()
    const { accounts } = useAccounts()
    const [editingBudget, setEditingBudget] = useState(null)
    const [showShareModal, setShowShareModal] = useState(false)
    const [members, setMembers] = useState([])

    const budget = budgets.find(b => b.id === id)
    const linkedAccount = budget && budget.account_id ? accounts.find(a => a.id === budget.account_id) : null

    const { transactions, loading: transactionsLoading, error } = useTransactions(id, linkedAccount?.id)

    const loading = budgetsLoading || transactionsLoading

    useEffect(() => {
        if (!id) return
        const fetchMembers = async () => {
            const { data } = await supabase
                .from('budget_members')
                .select(`role, user:profiles!user_id(full_name, email)`)
                .eq('budget_id', id)
            if (data) setMembers(data)
        }
        fetchMembers()
    }, [id])

    const refreshMembers = async () => {
        const { data } = await supabase
            .from('budget_members')
            .select(`role, user:profiles!user_id(full_name, email)`)
            .eq('budget_id', id)
        if (data) setMembers(data)
    }

    const handleUpdateBudget = async (budgetData) => {
        await updateBudget(id, budgetData)
        setEditingBudget(null)
    }

    const handleDeleteBudget = async () => {
        if (window.confirm('¿Estás seguro de eliminar este presupuesto? Esta acción no se puede deshacer.')) {
            await deleteBudget(id)
            navigate('/budgets')
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!budget) {
        return (
            <div className="p-4">
                <button onClick={() => navigate('/budgets')} className="flex items-center gap-2 text-gray-600 mb-4">
                    <ArrowLeft size={18} /> Volver
                </button>
                <p className="text-gray-500">Presupuesto no encontrado.</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 text-center">
                <p className="text-red-500 mb-2">Error al cargar transacciones</p>
                <p className="text-sm text-gray-500">{error}</p>
            </div>
        )
    }

    const totalSpent = transactions
        .filter(t => {
            if (budget.account_id) {
                if (t.is_transfer && t.account_id === budget.account_id) return true
                if (!t.is_transfer && t.type === 'egreso') return true
                return false
            }
            return t.type === 'egreso'
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0)

    let totalIncome = 0
    let progressPercentage = 0

    if (linkedAccount && budget.type === 'ahorro') {
        totalIncome = linkedAccount.current_balance
    } else {
        totalIncome = transactions
            .filter(t => {
                if (budget.account_id) {
                    if (t.is_transfer && t.transfer_target_id === budget.account_id) return true
                    if (!t.is_transfer && t.type === 'ingreso') return true
                    return false
                }
                return t.type === 'ingreso'
            })
            .reduce((sum, t) => sum + (t.amount || 0), 0)
    }

    if (budget.monthly_limit > 0) {
        if (budget.type === 'gasto') {
            progressPercentage = Math.min((totalSpent / budget.monthly_limit) * 100, 100)
        } else {
            progressPercentage = Math.min((totalIncome / budget.monthly_limit) * 100, 100)
        }
    }

    const isSavings = budget.type === 'ahorro'
    const currency = budget.base_currency || 'ARS'
    const fmt = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(val)

    // Colors
    const gradientClass = isSavings
        ? 'from-green-500 to-emerald-600'
        : progressPercentage > 90
            ? 'from-red-500 to-rose-600'
            : 'from-blue-500 to-indigo-600'

    const mainValue = isSavings ? totalIncome : totalSpent
    const mainLabel = isSavings ? 'Total Ahorrado' : 'Total Gastado'
    const MainIcon = isSavings ? PiggyBank : Wallet

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{budget.name}</h1>
                        <p className="text-sm text-gray-500">{isSavings ? 'Presupuesto de ahorro' : 'Presupuesto de gastos'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="p-2 hover:bg-blue-50 rounded-full text-blue-600 transition-colors"
                        title="Compartir"
                    >
                        <UserPlus size={20} />
                    </button>
                    <button
                        onClick={() => setEditingBudget(budget)}
                        className="p-2 hover:bg-blue-50 rounded-full text-blue-600 transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={20} />
                    </button>
                    <button
                        onClick={handleDeleteBudget}
                        className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                        title="Eliminar presupuesto"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Hero Card */}
            <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-6 text-white mb-6 shadow-lg`}>
                <div className="text-center mb-6">
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wider mb-1">{mainLabel}</p>
                    <p className="text-4xl font-bold">{fmt(mainValue)}</p>
                    {budget.monthly_limit > 0 && (
                        <p className="text-sm opacity-75 mt-1">
                            {isSavings ? 'meta' : 'límite'}: {fmt(budget.monthly_limit)}
                        </p>
                    )}
                </div>

                {/* Progress bar — only if limit is set */}
                {budget.monthly_limit > 0 && (
                    <div className="mb-2">
                        <div className="flex justify-between text-xs opacity-80 mb-1">
                            <span>Progreso</span>
                            <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-700 rounded-full"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingDown size={16} className="text-red-500" />
                        <p className="text-xs text-red-600 font-medium">Gastos</p>
                    </div>
                    <p className="text-lg font-bold text-red-700">{fmt(totalSpent)}</p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={16} className="text-green-500" />
                        <p className="text-xs text-green-600 font-medium">{isSavings ? 'Ahorrado' : 'Ingresos'}</p>
                    </div>
                    <p className="text-lg font-bold text-green-700">{fmt(totalIncome)}</p>
                </div>
            </div>

            {/* Transactions */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Transacciones</h2>
                {transactions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Receipt size={28} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No hay transacciones registradas</p>
                        <p className="text-gray-400 text-xs mt-1">Las transacciones ligadas a este presupuesto aparecerán aquí</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((transaction) => {
                            let isPositive = false

                            if (budget.account_id) {
                                if (transaction.is_transfer) {
                                    isPositive = transaction.transfer_target_id === budget.account_id
                                } else {
                                    isPositive = transaction.type === 'ingreso'
                                }
                            } else {
                                isPositive = transaction.type === 'ingreso'
                            }

                            return (
                                <div
                                    key={transaction.id}
                                    onClick={() => navigate(`/transactions/${transaction.id}`)}
                                    className="bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md active:scale-[0.99] transition-all"
                                >
                                    <div className="flex-1 mr-4 overflow-hidden">
                                        <p className="font-medium text-gray-900 truncate text-sm flex items-center gap-2">
                                            {transaction.is_transfer
                                                ? 'Transferencia'
                                                : (transaction.category?.name || 'Sin categoría')}
                                            {transaction.is_transfer && budget.account_id && transaction.transfer_target_id === budget.account_id && (
                                                <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Entrante</span>
                                            )}
                                            {transaction.is_transfer && budget.account_id && transaction.account_id === budget.account_id && (
                                                <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Saliente</span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                            <span>{transaction.account?.name}</span>
                                            <span>·</span>
                                            <span>{new Date(transaction.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                                            {transaction.user && (
                                                <>
                                                    <span>·</span>
                                                    <span className="flex items-center gap-0.5" title={transaction.user.email}>
                                                        <User size={10} />
                                                        {transaction.user_id === user?.id ? 'Tú' : (transaction.user.full_name || transaction.user.email)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`font-bold whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? '+' : '-'}
                                        {new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: transaction.currency || 'ARS',
                                        }).format(transaction.amount)}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Edit Budget Modal */}
            {editingBudget && (
                <CreateBudgetForm
                    initialData={editingBudget}
                    onSubmit={handleUpdateBudget}
                    onCancel={() => setEditingBudget(null)}
                />
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                resourceType="budget"
                resourceId={id}
                resourceName={budget.name}
                onMemberAdded={refreshMembers}
            />
        </div>
    )
}
