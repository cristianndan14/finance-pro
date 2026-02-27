import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useAnalytics = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [expensesByCategory, setExpensesByCategory] = useState([])
    const [monthlyStats, setMonthlyStats] = useState([])
    const [kpis, setKpis] = useState({
        totalIncome: 0,
        totalExpense: 0,
        savingsRate: 0,
        netSavings: 0,
        balanceByCurrency: {}
    })

    const fetchAnalytics = async () => {
        if (!user) return
        setLoading(true)
        try {
            // 1. Fetch transactions for the last 6 months
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

            const { data: transactions, error } = await supabase
                .from('transactions')
                .select(`
                    amount,
                    type,
                    created_at,
                    is_transfer,
                    transfer_target_id,
                    category:categories(name, color),
                    account:accounts!account_id(currency)
                `)
                .eq('user_id', user.id)
                .gte('created_at', sixMonthsAgo.toISOString())
                .order('created_at', { ascending: true })

            if (error) throw error

            // 1.5 Fetch Accounts for Balance by Currency
            const { data: accounts, error: accountsError } = await supabase
                .from('accounts')
                .select('id, type, current_balance, currency')

            if (accountsError) throw accountsError

            const balanceByCurrency = {}
            accounts.forEach(acc => {
                const cur = (acc.currency || 'ARS').toUpperCase()
                balanceByCurrency[cur] = (balanceByCurrency[cur] || 0) + (Number(acc.current_balance) || 0)
            })

            // For now, we'll process all transactions regardless of currency to ensure data visibility.
            // In a future update, we should implement currency conversion.
            const processedTransactions = transactions

            // Helper to get account type
            const getAccountType = (id) => {
                const acc = accounts.find(a => a.id === id)
                return acc ? acc.type : null
            }

            // 2. Process Monthly Stats (Income vs Expense)
            const statsMap = {}
            processedTransactions.forEach(t => {
                const monthKey = t.created_at.slice(0, 7) // YYYY-MM
                if (!statsMap[monthKey]) {
                    statsMap[monthKey] = { name: monthKey, income: 0, expense: 0 }
                }
                
                const isExpenseTransferToCredit = t.is_transfer && getAccountType(t.transfer_target_id) === 'credit'

                if (t.type === 'ingreso' && !t.is_transfer) {
                    statsMap[monthKey].income += Number(t.amount)
                } else if (t.type === 'egreso') {
                    if (!t.is_transfer || isExpenseTransferToCredit) {
                        statsMap[monthKey].expense += Number(t.amount)
                    }
                }
            })
            const sortedStats = Object.values(statsMap).sort((a, b) => a.name.localeCompare(b.name))

            // Format month names
            const formattedStats = sortedStats.map(item => {
                const [year, month] = item.name.split('-')
                const date = new Date(year, month - 1)
                return {
                    ...item,
                    shortName: date.toLocaleDateString('es-AR', { month: 'short' }),
                    fullName: date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
                }
            })
            setMonthlyStats(formattedStats)

            // 3. Process Expenses by Category (Current Month)
            const currentMonth = new Date().toISOString().slice(0, 7)
            const currentMonthExpenses = processedTransactions.filter(t => {
                if (!t.created_at.startsWith(currentMonth)) return false
                if (t.type !== 'egreso') return false
                
                const isExpenseTransferToCredit = t.is_transfer && getAccountType(t.transfer_target_id) === 'credit'
                return !t.is_transfer || isExpenseTransferToCredit
            })

            const categoryMap = {}
            currentMonthExpenses.forEach(t => {
                const catName = t.category?.name || 'Varios'
                if (!categoryMap[catName]) {
                    categoryMap[catName] = { name: catName, value: 0, color: t.category?.color || 'gray' }
                }
                categoryMap[catName].value += Number(t.amount)
            })

            setExpensesByCategory(Object.values(categoryMap).sort((a, b) => b.value - a.value))

            // 4. KPIs (Current Month)
            const currentStats = statsMap[currentMonth] || { income: 0, expense: 0 }
            const netSavings = currentStats.income - currentStats.expense
            const savingsRate = currentStats.income > 0 ? (netSavings / currentStats.income) * 100 : 0

            setKpis({
                totalIncome: currentStats.income,
                totalExpense: currentStats.expense,
                netSavings,
                savingsRate,
                balanceByCurrency
            })

        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
    }, [user?.id])

    return {
        loading,
        expensesByCategory,
        monthlyStats,
        kpis,
        refreshAnalytics: fetchAnalytics
    }
}
