import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useAccounts = () => {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAccounts = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addAccount = async (accountData) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ ...accountData, user_id: user.id }])
        .select()

      if (error) throw error
      setAccounts((prev) => [data[0], ...prev])
      return data[0]
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateAccount = async (accountId, accountData) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(accountData)
        .eq('id', accountId)
        .select()

      if (error) throw error
      setAccounts((prev) => prev.map(acc => acc.id === accountId ? data[0] : acc))
      return data[0]
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteAccount = async (accountId) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId)

      if (error) throw error
      setAccounts((prev) => prev.filter(acc => acc.id !== accountId))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [user?.id])

  return { accounts, loading, error, addAccount, updateAccount, deleteAccount, refreshAccounts: fetchAccounts }
}
