import { Wallet, TrendingUp, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function BudgetCard({ budget }) {
    const navigate = useNavigate()
    const [totalSpent, setTotalSpent] = useState(0)
    const [loading, setLoading] = useState(true)

    const isShared = budget.budget_members?.length > 1

    useEffect(() => {
        const fetchData = async () => {
            try {
                const linkedAccountId = budget.account_id

                // 1. Savings Budget + Linked Account = Direct Balance
                if (linkedAccountId && budget.type === 'ahorro') {
                    const { data: account, error: accountError } = await supabase
                        .from('accounts')
                        .select('current_balance')
                        .eq('id', linkedAccountId)
                        .single()

                    if (accountError) throw accountError
                    setTotalSpent(account.current_balance)
                    setLoading(false)
                    return
                }

                // 2. Expense/Unlinked Savings = Transaction Summation
                let query = supabase
                    .from('transactions')
                    .select('amount, type, is_transfer, account_id, transfer_target_id')
                    .order('created_at', { ascending: false })

                // Build filter: Same "OR" logic as useTransactions
                if (linkedAccountId) {
                    query = query.or(`budget_id.eq.${budget.id},account_id.eq.${linkedAccountId},transfer_target_id.eq.${linkedAccountId}`)
                } else {
                    query = query.eq('budget_id', budget.id)
                }

                const { data, error } = await query

                if (error) throw error

                // Calculate Totals using Smart Logic (matches BudgetDetailPage)
                let expenses = 0
                let income = 0

                data.forEach(t => {
                    if (linkedAccountId) {
                        // Linked Logic
                        // Expense: Transfer OUT or Regular Expense
                        if ((t.is_transfer && t.account_id === linkedAccountId) || (!t.is_transfer && t.type === 'egreso')) {
                            expenses += (t.amount || 0)
                        }
                        // Income: Transfer IN or Regular Income
                        if ((t.is_transfer && t.transfer_target_id === linkedAccountId) || (!t.is_transfer && t.type === 'ingreso')) {
                            income += (t.amount || 0)
                        }
                    } else {
                        // Unlinked Logic
                        if (t.type === 'egreso') expenses += (t.amount || 0)
                        if (t.type === 'ingreso') income += (t.amount || 0)
                    }
                })

                let calculatedTotal = 0;
                if (budget.type === 'ahorro') {
                    // For unlinked savings, it's net income (or just input if we ignore expenses? DetailPage logic uses Total Income/Ahorrado as just the Income part)
                    // DetailPage: totalIncome = transactions.filter(...).reduce(...)
                    // Detail page doesn't subtract expenses for Savings Budgets "Ahorrado" value, it just shows "Income" accumulator.
                    // Let's match DetailPage "totalIncome" var.
                    calculatedTotal = income;
                } else {
                    // For expenses, it's total spent
                    calculatedTotal = expenses;
                }

                setTotalSpent(calculatedTotal)
            } catch (err) {
                console.error('Error fetching budget data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()

        // Realtime Subscription
        const channels = []
        // Listen to all transactions for simplicity/robustness if filtering is complex
        const txChannel = supabase
            .channel(`budget-card-tx-${budget.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
            .subscribe()
        channels.push(txChannel)

        if (budget.account_id) {
            const accChannel = supabase
                .channel(`budget-card-acc-${budget.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `id=eq.${budget.account_id}` }, () => fetchData())
                .subscribe()
            channels.push(accChannel)
        }

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch))
        }
    }, [budget.id, budget.type, budget.account_id])

    const progressPercentage = budget.monthly_limit
        ? Math.min((totalSpent / budget.monthly_limit) * 100, 100)
        : 0

    // Progress Bar Color Logic
    let progressBarColor = 'bg-blue-600'
    if (budget.type === 'gasto') {
        if (progressPercentage > 90) progressBarColor = 'bg-red-600'
        else if (progressPercentage > 70) progressBarColor = 'bg-yellow-500' // Changed to 500 for better visibility
        else progressBarColor = 'bg-blue-600'
    } else {
        // Savings
        progressBarColor = 'bg-green-500'
    }

    return (
        <div
            onClick={() => navigate(`/budgets/${budget.id}`)}
            className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${budget.type === 'ahorro'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                        }`}>
                        {budget.type === 'ahorro' ? <TrendingUp size={20} /> : <Wallet size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{budget.name}</h3>
                        <p className="text-xs text-gray-500 capitalize">{budget.type}</p>
                    </div>
                </div>
                {isShared && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={14} />
                        <span>{budget.budget_members.length}</span>
                    </div>
                )}
            </div>

            {budget.monthly_limit && !loading && (
                <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">
                            {budget.type === 'ahorro' ? 'Ahorrado' : 'Gastado'}
                        </span>
                        <span className="font-bold text-gray-900">
                            {new Intl.NumberFormat('es-AR', {
                                style: 'currency',
                                currency: budget.base_currency || 'ARS',
                            }).format(totalSpent)}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{Math.round(progressPercentage)}%</span>
                        <span>Meta: {new Intl.NumberFormat('es-AR', {
                            style: 'currency',
                            currency: budget.base_currency || 'ARS',
                        }).format(budget.monthly_limit)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${progressBarColor}`}
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    )
}
