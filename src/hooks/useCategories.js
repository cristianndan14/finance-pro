import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useCategories = () => {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchCategories = async () => {
        setLoading(true)
        try {
            // RLS policies return: system categories (user_id IS NULL) + user's own categories
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setCategories(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    // System categories: predefined, not editable by users
    const systemCategories = useMemo(() => categories.filter(c => c.user_id === null), [categories])
    // User categories: created and managed by the authenticated user
    const userCategories = useMemo(() => categories.filter(c => c.user_id !== null), [categories])

    return { categories, systemCategories, userCategories, loading, error, refreshCategories: fetchCategories }
}
