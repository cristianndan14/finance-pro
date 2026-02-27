import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useTransactions = (budgetId = null, accountId = null) => {
    const { user } = useAuth()
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchTransactions = async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            let query = supabase
                .from('transactions')
                .select(`
          *,
          category:categories(name, icon, color),
          account:accounts!account_id(name, type, currency)
        `)
                .order('created_at', { ascending: false })

            if (budgetId) {
                // If it's a linked budget (has accountId), we want transactions for that budget OR that account
                if (accountId) {
                    // Complex filter: budget_id = X OR account_id = Y OR transfer_target_id = Y
                    query = query.or(`budget_id.eq.${budgetId},account_id.eq.${accountId},transfer_target_id.eq.${accountId}`)
                } else {
                    query = query.eq('budget_id', budgetId)
                }
            } else if (accountId) {
                // Just filtering by account
                query = query.or(`account_id.eq.${accountId},transfer_target_id.eq.${accountId}`)
            } else {
                // General fetch (Dashboard, Transactions list) - filter by user_id
                query = query.eq('user_id', user.id)
            }

            const { data, error } = await query

            if (error) throw error
            setTransactions(data)
        } catch (err) {
            console.error('Error fetching transactions:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const createTransaction = async (transactionData) => {
        try {
            const dataToInsert = Array.isArray(transactionData)
                ? transactionData.map(t => ({ ...t, user_id: user.id }))
                : { ...transactionData, user_id: user.id }

            const { data, error } = await supabase
                .from('transactions')
                .insert(dataToInsert)
                .select()

            if (error) throw error

            // No need to fetch manually if using realtime, but good for immediate feedback
            await fetchTransactions()
            return data[0]
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const createTransfer = async ({ sourceAccountId, targetAccountId, amount, description, budgetId }) => {
        try {
            const { data, error } = await supabase.rpc('perform_transfer', {
                p_source_account_id: sourceAccountId,
                p_target_account_id: targetAccountId,
                p_amount: amount,
                p_description: description,
                p_date: new Date().toISOString(),
                p_budget_id: budgetId || null
            })

            if (error) throw error

            await fetchTransactions()
            return data
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    useEffect(() => {
        fetchTransactions()

        // Realtime subscription logic (simplified for now to just listen to all user changes)
        const channel = supabase
            .channel(`transactions-user-${user?.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                () => {
                    fetchTransactions()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.id, budgetId, accountId])

    return { transactions, loading, error, createTransaction, createTransfer, refreshTransactions: fetchTransactions }
}
