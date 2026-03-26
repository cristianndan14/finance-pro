import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useRecurringTransactions = () => {
    const { user } = useAuth()
    const [recurringTransactions, setRecurringTransactions] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchRecurringTransactions = async () => {
        if (!user) return
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('recurring_transactions')
                .select(`
            *,
            category:categories(name),
            account:accounts(name, currency),
            budget:budgets(name)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setRecurringTransactions(data)
        } catch (error) {
            console.error('Error fetching recurring transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const createRecurringTransaction = async (data) => {
        try {
            const { error } = await supabase
                .from('recurring_transactions')
                .insert([data])

            if (error) throw error
            await fetchRecurringTransactions()
        } catch (error) {
            throw error
        }
    }

    const updateRecurringTransaction = async (id, updates) => {
        try {
            const { error } = await supabase
                .from('recurring_transactions')
                .update(updates)
                .eq('id', id)

            if (error) throw error
            await fetchRecurringTransactions()
        } catch (error) {
            throw error
        }
    }

    const deleteRecurringTransaction = async (id) => {
        try {
            const { error } = await supabase
                .from('recurring_transactions')
                .delete()
                .eq('id', id)

            if (error) throw error
            await fetchRecurringTransactions()
        } catch (error) {
            throw error
        }
    }

    // --- LOGIC FOR GENERATING TRANSACTIONS ---

    const processDueTransactions = async () => {
        if (!user) return

        // 1. Fetch active recurring rules where next_execution_date <= today
        const today = new Date().toISOString().split('T')[0]

        const { data: dueRules, error: fetchError } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('status', 'active')
            .eq('is_automatic', true)
            .lte('next_execution_date', today)

        if (fetchError) {
            console.error("Error fetching due rules", fetchError)
            return
        }

        if (!dueRules || dueRules.length === 0) return

        console.log(`Found ${dueRules.length} due recurring transactions. Processing...`)

        for (const rule of dueRules) {
            // 2. Insert new transaction
            const { error: insertError } = await supabase
                .from('transactions')
                .insert({
                    budget_id: rule.budget_id,
                    category_id: rule.category_id,
                    account_id: rule.account_id,
                    amount: rule.amount,
                    type: rule.type,
                    currency: rule.currency || 'ARS',
                    description: rule.description || 'Transacción Recurrente',
                    recurring_id: rule.id,
                    // created_at defaults to now, which is correct for "record date"
                    // but usually we want the transaction to reflect the due date? 
                    // For simplicity V1, we use creation time.
                })

            if (insertError) {
                console.error(`Failed to generate transaction for rule ${rule.id}`, insertError)
                continue
            }

            // 3. Calculate next date
            let nextDate = new Date(rule.next_execution_date)
            // Add 1 day to ensure we don't process same day infinitely if logic is loose,
            // but adding interval is safer.

            switch (rule.frequency) {
                case 'daily':
                    nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'weekly':
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'monthly':
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
                case 'yearly':
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    break;
            }

            // 4. Update rule with next date
            await supabase
                .from('recurring_transactions')
                .update({ next_execution_date: nextDate.toISOString().split('T')[0] })
                .eq('id', rule.id)
        }

        // Refresh list if needed
        fetchRecurringTransactions()
    }

    useEffect(() => {
        fetchRecurringTransactions()
    }, [user?.id])

    return {
        recurringTransactions,
        loading,
        createRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        processDueTransactions // Expose manual trigger
    }
}
