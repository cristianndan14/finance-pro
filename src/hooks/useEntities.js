import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useEntities = () => {
    const { user } = useAuth()
    const [entities, setEntities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchEntities = async () => {
        if (!user) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('entities')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true })

            if (error) throw error
            setEntities(data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const addEntity = async (entityData) => {
        try {
            const { data, error } = await supabase
                .from('entities')
                .insert([{ ...entityData, user_id: user.id }])
                .select()

            if (error) throw error
            setEntities((prev) => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
            return data[0]
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const updateEntity = async (entityId, entityData) => {
        try {
            const { data, error } = await supabase
                .from('entities')
                .update(entityData)
                .eq('id', entityId)
                .select()

            if (error) throw error
            setEntities((prev) =>
                prev.map(ent => ent.id === entityId ? data[0] : ent)
                    .sort((a, b) => a.name.localeCompare(b.name))
            )
            return data[0]
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const deleteEntity = async (entityId) => {
        try {
            const { error } = await supabase
                .from('entities')
                .delete()
                .eq('id', entityId)

            if (error) throw error
            setEntities((prev) => prev.filter(ent => ent.id !== entityId))
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    useEffect(() => {
        fetchEntities()
    }, [user?.id])

    return { entities, loading, error, addEntity, updateEntity, deleteEntity, refreshEntities: fetchEntities }
}
