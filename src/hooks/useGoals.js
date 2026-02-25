import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useGoals = () => {
    const { user } = useAuth()
    const [goals, setGoals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchGoals = async () => {
        if (!user) return
        setLoading(true)
        try {
            // Fetch goals (without embedded join to avoid 400 errors with RLS)
            const { data: goalsData, error: goalsError } = await supabase
                .from('goals')
                .select('id, name, target_amount, deadline, user_id, created_at, account_id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (goalsError) throw goalsError

            // Fetch linked accounts separately to avoid embedded-join 400 errors
            const accountIds = (goalsData || [])
                .map(g => g.account_id)
                .filter(Boolean)

            let accountsMap = {}
            if (accountIds.length > 0) {
                const { data: accountsData } = await supabase
                    .from('accounts')
                    .select('id, name, current_balance, currency')
                    .in('id', accountIds)
                if (accountsData) {
                    accountsMap = Object.fromEntries(accountsData.map(a => [a.id, a]))
                }
            }

            // Shape data to match what the UI expects
            const shaped = (goalsData || []).map(g => {
                const account = g.account_id ? accountsMap[g.account_id] || null : null
                return {
                    ...g,
                    account,
                    myAccount: account,
                    totalSaved: account?.current_balance || 0,
                    participants: [{ user_id: user.id }],
                    myParticipation: { account_id: g.account_id },
                }
            })

            setGoals(shaped)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Creates a new goal linked to an existing account.
     * @param {object} goalData - { name, target_amount, deadline }
     * @param {string} accountId - The account the user will use to save (required)
     */
    const createGoal = async (goalData, accountId) => {
        if (!accountId) throw new Error('Debes seleccionar una cuenta para ahorrar.')
        try {
            const { data: goal, error: goalError } = await supabase
                .from('goals')
                .insert([{
                    name: goalData.name,
                    target_amount: goalData.target_amount,
                    deadline: goalData.deadline || null,
                    user_id: user.id,
                    account_id: accountId,
                }])
                .select()
                .single()

            if (goalError) throw goalError

            await fetchGoals()
            return goal
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    /**
     * Deletes a goal. Only the creator can delete it.
     */
    const deleteGoal = async (goalId) => {
        try {
            const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', goalId)
                .eq('user_id', user.id)

            if (error) throw error
            setGoals(prev => prev.filter(g => g.id !== goalId))
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    /**
     * Updates a goal's linked account.
     */
    const updateGoalAccount = async (goalId, accountId) => {
        try {
            const { error } = await supabase
                .from('goals')
                .update({ account_id: accountId })
                .eq('id', goalId)
                .eq('user_id', user.id)

            if (error) throw error
            await fetchGoals()
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    useEffect(() => {
        fetchGoals()

        const channel = supabase
            .channel('goals-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => fetchGoals())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.id])

    return { goals, loading, error, createGoal, deleteGoal, updateGoalAccount, refreshGoals: fetchGoals }
}
