import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useBudgets = () => {
    const { user } = useAuth()
    const [budgets, setBudgets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchBudgets = async () => {
        if (!user) return
        setLoading(true)
        try {
            // Fetch budgets - RLS policies handle access control
            const { data, error } = await supabase
                .from('budgets')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            // Fetch member count for each budget
            const budgetsWithMembers = await Promise.all(
                data.map(async (budget) => {
                    const { data: members } = await supabase
                        .from('budget_members')
                        .select('user_id, role')
                        .eq('budget_id', budget.id)

                    return { ...budget, budget_members: members || [] }
                })
            )

            setBudgets(budgetsWithMembers)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const createBudget = async (budgetData) => {
        try {
            const { data, error } = await supabase
                .from('budgets')
                .insert([{ ...budgetData, owner_id: user.id }])
                .select()

            if (error) throw error

            // Refresh budgets to get the new one with categories
            await fetchBudgets()
            return data[0]
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const updateBudget = async (budgetId, budgetData) => {
        try {
            const { data, error } = await supabase
                .from('budgets')
                .update(budgetData)
                .eq('id', budgetId)
                .select()

            if (error) throw error
            await fetchBudgets()
            return data[0]
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const deleteBudget = async (budgetId) => {
        try {
            const { error } = await supabase
                .from('budgets')
                .delete()
                .eq('id', budgetId)

            if (error) throw error
            setBudgets((prev) => prev.filter(b => b.id !== budgetId))
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    useEffect(() => {
        fetchBudgets()
    }, [user?.id])

    return { budgets, loading, error, createBudget, updateBudget, deleteBudget, refreshBudgets: fetchBudgets }
}
