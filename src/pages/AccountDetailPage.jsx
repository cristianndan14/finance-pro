import { useParams, useNavigate } from 'react-router-dom'
import { useAccounts } from '../hooks/useAccounts'
import { ArrowLeft, Loader2, TrendingDown, TrendingUp, Edit2, Trash2, ArrowRightLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import CreateAccountForm from '../components/ui/CreateAccountForm'
import TransferModal from '../components/ui/TransferModal'
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export default function AccountDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { accounts, loading: accountsLoading, updateAccount, deleteAccount } = useAccounts()
    const PAST_MONTHS = 12
    const [selectedMonthOffset, setSelectedMonthOffset] = useState(PAST_MONTHS)
    const [transactions, setTransactions] = useState([])
    const [transactionsLoading, setTransactionsLoading] = useState(true)
    const [editingAccount, setEditingAccount] = useState(null)
    const [showTransferModal, setShowTransferModal] = useState(false)

    const account = accounts.find(a => a.id === id)

    // Helper to get statement month for a given date and closing day
    const getStatementPeriod = (dateStr, closingDay) => {
        const date = new Date(dateStr)
        const day = date.getDate()
        let month = date.getMonth()
        let year = date.getFullYear()

        if (closingDay && day > closingDay) {
            month += 1
            if (month > 11) {
                month = 0
                year += 1
            }
        }
        return { month, year }
    }

    // Generate past and future statement months (12 back, 12 forward)
    const statementMonthsArr = Array.from({ length: 24 }, (_, i) => {
        const offset = i - PAST_MONTHS
        const date = new Date()
        date.setMonth(date.getMonth() + offset)
        // Adjust for current month if we are past the closing day
        if (account?.closing_day && new Date().getDate() > account.closing_day) {
            date.setMonth(date.getMonth() + 1)
        }
        return {
            label: date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }),
            month: date.getMonth(),
            year: date.getFullYear(),
            offset: i
        }
    })

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const { data, error } = await supabase
                    .from('transactions')
                    .select(`
            *,
            category:categories(name),
            budget:budgets(name)
          `)
                    .or(`account_id.eq.${id},transfer_target_id.eq.${id}`)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setTransactions(data)
            } catch (err) {
                console.error('Error fetching transactions:', err)
            } finally {
                setTransactionsLoading(false)
            }
        }

        if (id) {
            fetchTransactions()

            const channel = supabase
                .channel(`account-${id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'transactions',
                    },
                    (payload) => {
                        if (payload.new?.account_id === id || payload.new?.transfer_target_id === id || payload.old?.account_id === id) {
                            fetchTransactions()
                        }
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [id])

    const handleUpdateAccount = async (accountData) => {
        await updateAccount(id, accountData)
        setEditingAccount(null)
    }

    const handleDeleteAccount = async () => {
        if (window.confirm('¿Estás seguro de eliminar esta cuenta? Esta acción no se puede deshacer.')) {
            await deleteAccount(id)
            navigate('/')
        }
    }

    if (accountsLoading || transactionsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!account) {
        return (
            <div className="p-4">
                <p className="text-gray-500">Cuenta no encontrada</p>
            </div>
        )
    }

    const targetPeriod = statementMonthsArr[selectedMonthOffset]

    const filteredTransactions = transactions.filter(t => {
        if (account.type !== 'credit') return true
        const period = getStatementPeriod(t.created_at, account.closing_day)
        return period.month === targetPeriod.month && period.year === targetPeriod.year
    })

    const { totalIncome, totalExpenses, surplus, surplusOrigin, singlePaymentDebt, installmentDebt, totalDebt, totalDebtUsd } = (() => {
        if (account.type !== 'credit') {
            const income = filteredTransactions
                .filter(t => (t.type === 'ingreso' && !t.is_transfer) || (t.is_transfer && t.transfer_target_id === id))
                .reduce((sum, t) => sum + (t.amount || 0), 0)
            const expenses = filteredTransactions
                .filter(t => (t.type === 'egreso' && !t.is_transfer) || (t.is_transfer && t.account_id === id))
                .reduce((sum, t) => sum + (t.amount || 0), 0)
            return { totalIncome: income, totalExpenses: expenses, surplus: 0, surplusOrigin: null, singlePaymentDebt: 0, installmentDebt: 0, totalDebt: 0, totalDebtUsd: 0 }
        }

        // 1. Group ALL transactions by period
        const periodBalances = {}
        transactions.forEach(t => {
            const p = getStatementPeriod(t.created_at, account.closing_day)
            const key = `${p.year}-${String(p.month).padStart(2, '0')}`
            if (!periodBalances[key]) periodBalances[key] = 0

            const isInc = (t.type === 'ingreso' && !t.is_transfer) || (t.is_transfer && t.transfer_target_id === id)
            const isExp = (t.type === 'egreso' && !t.is_transfer) || (t.is_transfer && t.account_id === id)
            if (isInc) periodBalances[key] += (t.amount || 0)
            if (isExp) periodBalances[key] -= (t.amount || 0)
        })

        // 2. Sort periods chronologically
        const sortedPeriods = Object.keys(periodBalances).sort()

        // 3. Calculate running balance and origin
        let runningBalance = 0
        let currentOrigin = null
        const targetKey = `${targetPeriod.year}-${String(targetPeriod.month).padStart(2, '0')}`

        for (const key of sortedPeriods) {
            if (key >= targetKey) break

            const prevBalance = runningBalance
            runningBalance += periodBalances[key]

            // If it just became positive or was already positive
            if (runningBalance > 0) {
                if (prevBalance <= 0) {
                    // This month started the surplus
                    const [y, m] = key.split('-').map(Number)
                    currentOrigin = { month: m, year: y }
                }
            } else {
                currentOrigin = null
            }
        }

        const incomeInPeriod = filteredTransactions
            .filter(t => (t.type === 'ingreso' && !t.is_transfer) || (t.is_transfer && t.transfer_target_id === id) || (t.is_transfer && t.account_id === id)) // Correcting filteredTransactions for CC payments
            .reduce((sum, t) => sum + (t.amount || 0), 0)

        // Correction: incomeInPeriod and expensesInPeriod should be based on the statement period logic for credit cards
        // Wait, filteredTransactions is already filtered by current period.
        // But for credit cards, we should be careful. 
        // Actually, the previous logic was simpler:
        const expensesInPeriod = filteredTransactions
            .filter(t => (t.type === 'egreso' && !t.is_transfer) || (t.is_transfer && t.account_id === id))
            .reduce((sum, t) => sum + (t.amount || 0), 0)

        // Calculate Single Payment vs Installment Debt using bucket logic
        let totalExpensesSingle = 0
        let totalExpensesInstallments = 0
        let totalPayments = 0

        transactions.forEach(t => {
            const isExp = (t.type === 'egreso' && !t.is_transfer) || (t.is_transfer && t.account_id === id)
            const isInc = (t.type === 'ingreso' && !t.is_transfer) || (t.is_transfer && t.transfer_target_id === id)

            if (isExp) {
                if (t.installments_count > 1) {
                    totalExpensesInstallments += (t.amount || 0)
                } else {
                    totalExpensesSingle += (t.amount || 0)
                }
            } else if (isInc) {
                totalPayments += (t.amount || 0)
            }
        })

        const totalDebt = Math.abs(account.current_balance || 0)
        const totalDebtUsd = Math.abs(account.current_balance_usd || 0)
        // We assume payments pay off single purchases first
        const singlePaymentDebt = Math.max(0, totalExpensesSingle - totalPayments)
        const installmentDebt = Math.max(0, totalExpensesInstallments - Math.max(0, totalPayments - totalExpensesSingle))

        return {
            totalIncome: incomeInPeriod + (runningBalance > 0 ? runningBalance : 0),
            totalExpenses: expensesInPeriod,
            surplus: runningBalance > 0 ? runningBalance : 0,
            surplusOrigin: currentOrigin,
            singlePaymentDebt,
            installmentDebt,
            totalDebt,
            totalDebtUsd
        }
    })()

    return (
        <div className="p-4 pb-20">
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
                        <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
                        <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTransferModal(true)}
                        className="p-2 hover:bg-blue-50 rounded-full text-blue-600 transition-colors"
                        title="Transferir"
                    >
                        <ArrowRightLeft size={20} />
                    </button>
                    <button
                        onClick={() => setEditingAccount(account)}
                        className="p-2 hover:bg-blue-50 rounded-full text-blue-600 transition-colors"
                        title="Editar"
                    >
                        <Edit2 size={20} />
                    </button>
                    <button
                        onClick={handleDeleteAccount}
                        className="p-2 hover:bg-red-50 rounded-full text-red-600 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Balance Card */}
            <div className={cn(
                "rounded-2xl p-6 text-white mb-6 shadow-lg relative overflow-hidden",
                account.type === 'credit' ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-blue-600 to-blue-700"
            )}>
                <div className="relative z-10">
                    <div className="mb-6 text-center">
                        <p className="text-sm font-medium opacity-90 mb-1 uppercase tracking-wider">
                            {account.type === 'credit' ? 'Deuda ARS' : 'Saldo Actual'}
                        </p>
                        <p className="text-4xl font-bold leading-tight">
                            {new Intl.NumberFormat('es-AR', {
                                style: 'currency',
                                currency: account.type === 'credit' ? 'ARS' : (account.currency || 'ARS'),
                            }).format(account.type === 'credit' ? totalDebt : account.current_balance)}
                        </p>
                        {account.type === 'credit' && (totalDebtUsd > 0 || Number(account.credit_limit_usd) > 0) && (
                            <div className="mt-3">
                                <p className="text-[10px] font-medium opacity-80 mb-0.5 uppercase tracking-wider">
                                    Deuda USD
                                </p>
                                <p className="text-2xl font-bold leading-tight text-white/90">
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                    }).format(totalDebtUsd)}
                                </p>
                            </div>
                        )}
                    </div>

                    {account.type === 'credit' && (
                        account.installments_limit ? (
                            <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-6 mb-2">
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">Disponible 1 Pago</p>
                                    <p className="text-xl font-bold">
                                        {new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: account.currency || 'ARS',
                                        }).format(Math.max(0, (account.credit_limit || 0) - singlePaymentDebt))}
                                    </p>
                                    <p className="text-[11px] opacity-60 mt-1 font-medium">
                                        Límite: {new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: account.currency || 'ARS',
                                            maximumFractionDigits: 0
                                        }).format(account.credit_limit || 0)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">Disponible Cuotas</p>
                                    <p className="text-xl font-bold">
                                        {new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: account.currency || 'ARS',
                                        }).format(Math.max(0, (account.installments_limit || account.credit_limit || 0) - installmentDebt))}
                                    </p>
                                    <p className="text-[11px] opacity-60 mt-1 font-medium">
                                        Límite: {new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: account.currency || 'ARS',
                                            maximumFractionDigits: 0
                                        }).format(account.installments_limit || account.credit_limit || 0)}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-white/10 pt-6 mb-2 text-center">
                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70 mb-1">Disponible Total</p>
                                <p className="text-3xl font-bold">
                                    {new Intl.NumberFormat('es-AR', {
                                        style: 'currency',
                                        currency: account.currency || 'ARS',
                                    }).format(Math.max(0, (account.credit_limit || 0) - totalDebt))}
                                </p>
                                <p className="text-xs opacity-60 mt-2 font-medium">
                                    Límite total: {new Intl.NumberFormat('es-AR', {
                                        style: 'currency',
                                        currency: account.currency || 'ARS',
                                        maximumFractionDigits: 0
                                    }).format(account.credit_limit || 0)}
                                </p>
                            </div>
                        )
                    )}

                    {account.type === 'credit' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/10 pt-4">
                                <div>
                                    <p className="opacity-75 mb-1 text-[10px] uppercase font-bold tracking-wider">Cierre</p>
                                    <p className="font-bold">{account.closing_day ? `Día ${account.closing_day}` : '-'}</p>
                                </div>
                                <div>
                                    <p className="opacity-75 mb-1 text-[10px] uppercase font-bold tracking-wider">Vencimiento</p>
                                    <p className="font-bold">{account.due_day ? `Día ${account.due_day}` : '-'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {account.installments_limit ? (
                                    <>
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1 opacity-80 font-bold">
                                                <span>Consumo en un pago</span>
                                                <span>{((singlePaymentDebt / (account.credit_limit || 1)) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-white transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (singlePaymentDebt / (account.credit_limit || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1 opacity-80 font-bold">
                                                <span>Consumo en cuotas</span>
                                                <span>{((installmentDebt / (account.installments_limit || account.credit_limit || 1)) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-400 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, (installmentDebt / (account.installments_limit || account.credit_limit || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1 opacity-80 font-bold">
                                            <span>Crédito Ocupado</span>
                                            <span>{((totalDebt / (account.credit_limit || 1)) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white transition-all duration-500"
                                                style={{ width: `${Math.min(100, (totalDebt / (account.credit_limit || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowTransferModal(true)}
                    className="mt-6 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm flex items-center justify-center gap-2"
                >
                    <ArrowRightLeft size={16} />
                    {account.type === 'credit' ? 'Pagar / Ajustar Saldo' : 'Transferir Dinero'}
                </button>
            </div>

            {/* Month Selector for Credit Cards - 3 Month Window with Arrows */}
            {account.type === 'credit' && (
                <div className="mb-6 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedMonthOffset(prev => Math.max(0, prev - 1))}
                            disabled={selectedMonthOffset === 0}
                            className={cn(
                                "p-2 rounded-full transition-all flex-shrink-0",
                                selectedMonthOffset === 0 ? "text-gray-200 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50 active:scale-90"
                            )}
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex-1 grid grid-cols-3 gap-2">
                            {(() => {
                                // Calculate which 3 months to show
                                let start = Math.max(0, selectedMonthOffset - 1);
                                let end = start + 3;
                                if (end > statementMonthsArr.length) {
                                    end = statementMonthsArr.length;
                                    start = Math.max(0, end - 3);
                                }

                                return statementMonthsArr.slice(start, end).map((m) => (
                                    <button
                                        key={m.offset}
                                        onClick={() => setSelectedMonthOffset(m.offset)}
                                        className={cn(
                                            "py-2 rounded-xl text-[10px] font-bold uppercase transition-all border flex flex-col items-center justify-center h-10 text-center leading-tight",
                                            selectedMonthOffset === m.offset
                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                : "bg-gray-50 text-gray-400 border-transparent hover:border-gray-200"
                                        )}
                                    >
                                        <span className="block">{m.label.split(' ')[0]}</span>
                                        <span className="block opacity-75 font-medium">{m.label.split(' ')[1]}</span>
                                    </button>
                                ));
                            })()}
                        </div>

                        <button
                            onClick={() => setSelectedMonthOffset(prev => Math.min(23, prev + 1))}
                            disabled={selectedMonthOffset === 23}
                            className={cn(
                                "p-2 rounded-full transition-all flex-shrink-0",
                                selectedMonthOffset === 23 ? "text-gray-200 cursor-not-allowed" : "text-blue-600 hover:bg-blue-50 active:scale-90"
                            )}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={16} className="text-green-600" />
                        <p className="text-xs text-green-600 font-medium">{account.type === 'credit' ? 'Pagos' : 'Ingresos'}</p>
                    </div>
                    <p className="text-xl font-bold text-green-700">
                        {new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: account.currency || 'ARS',
                        }).format(totalIncome)}
                    </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingDown size={16} className="text-red-600" />
                        <p className="text-xs text-red-600 font-medium">{account.type === 'credit' ? 'Consumo' : 'Egresos'}</p>
                    </div>
                    <p className="text-xl font-bold text-red-700">
                        {new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: account.currency || 'ARS',
                        }).format(totalExpenses)}
                    </p>
                </div>
            </div>

            {/* Transactions */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">
                    {account.type === 'credit' ? `Movimientos ${targetPeriod.label}` : 'Transacciones'}
                </h2>
                {filteredTransactions.length === 0 && surplus === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No hay movimientos en este periodo</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {surplus > 0 && (
                            <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex justify-between items-center shadow-sm">
                                <div className="flex-1 mr-4 overflow-hidden">
                                    <p className="font-bold text-green-700 truncate">
                                        Saldo a favor ({surplusOrigin ? `Desde ${new Date(surplusOrigin.year, surplusOrigin.month).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })}` : 'Periodo anterior'})
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Monto acumulado por pagos excedentes
                                    </p>
                                </div>
                                <p className="font-bold whitespace-nowrap text-green-600">
                                    + {new Intl.NumberFormat('es-AR', {
                                        style: 'currency',
                                        currency: account.currency || 'ARS',
                                    }).format(surplus)}
                                </p>
                            </div>
                        )}
                        {filteredTransactions.map((t) => {
                            let isPositive = false;
                            let cleanDesc = t.description?.replace(/\s\(Cuota\s\d+\/\d+\)$/, '') || '';
                            if (cleanDesc === 'Compra en cuotas') cleanDesc = '';

                            const categoryName = t.category?.name;
                            let label = cleanDesc;
                            if (cleanDesc && categoryName) {
                                label = `${cleanDesc} • ${categoryName}`;
                            } else if (!cleanDesc && categoryName) {
                                label = categoryName;
                            } else if (!cleanDesc && !categoryName) {
                                label = t.budget?.name || 'Sin categoría';
                            }

                            if (t.is_transfer) {
                                if (t.transfer_target_id === id) {
                                    isPositive = true;
                                    label = 'Transferencia Recibida';
                                } else {
                                    isPositive = false;
                                    label = 'Transferencia Enviada';
                                }
                            } else {
                                isPositive = t.type === 'ingreso';
                                if (t.installments_count > 1) {
                                    label += ` (${t.installment_number}/${t.installments_count})`;
                                }
                            }

                            return (
                                <div
                                    key={t.id}
                                    onClick={() => navigate(`/transactions/${t.id}`)}
                                    className="p-4 bg-white border border-gray-200 rounded-xl flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md active:scale-[0.99] transition-all"
                                >
                                    <div className="flex-1 mr-4 overflow-hidden">
                                        <p className="font-medium text-gray-900 truncate">
                                            {(() => {
                                                if (t.is_transfer && t.transfer_target_id === id && account.type === 'credit') {
                                                    const txDate = new Date(t.created_at)
                                                    return txDate.getDate() <= (account.closing_day || 31)
                                                        ? 'Adelanto de pago'
                                                        : 'Pago de tarjeta'
                                                }
                                                return label
                                            })()}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(t.created_at).toLocaleDateString('es-AR', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <p className={`font-bold whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? '+' : '-'}
                                        {new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: t.currency || 'ARS',
                                        }).format(t.amount)}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            {editingAccount && (
                <CreateAccountForm
                    initialData={editingAccount}
                    onSubmit={handleUpdateAccount}
                    onCancel={() => setEditingAccount(null)}
                />
            )}

            <TransferModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                preselectedSourceId={account.type !== 'credit' ? id : null}
                preselectedTargetId={account.type === 'credit' ? id : null}
            />
        </div>
    )
}
