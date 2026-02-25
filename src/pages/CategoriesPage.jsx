import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import { supabase } from '../lib/supabaseClient'
import { ArrowLeft, Plus, Edit2, Trash2, Tag, Loader2, Sparkles } from 'lucide-react'

const COLORS = [
    { name: 'blue', bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
    { name: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-600' },
    { name: 'red', bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600' },
    { name: 'amber', bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-600' },
    { name: 'violet', bg: 'bg-violet-500', light: 'bg-violet-100', text: 'text-violet-600' },
    { name: 'cyan', bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-600' },
    { name: 'rose', bg: 'bg-rose-500', light: 'bg-rose-100', text: 'text-rose-600' },
]

export default function CategoriesPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    // userCategories: only categories created by the authenticated user (no system ones)
    const { userCategories, systemCategories, loading, refreshCategories } = useCategories()
    const [editingId, setEditingId] = useState(null)
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState({ name: '', icon: 'Tag', color: 'blue' })
    const [actionLoading, setActionLoading] = useState(false)

    const getColor = (colorName) => COLORS.find(c => c.name === colorName) || COLORS[0]

    const handleEdit = (category) => {
        setEditingId(category.id)
        setFormData({ name: category.name, icon: category.icon, color: category.color })
        setIsCreating(false)
    }

    const handleCreate = () => {
        setEditingId(null)
        setFormData({ name: '', icon: 'Tag', color: 'blue' })
        setIsCreating(true)
    }

    const handleCancel = () => {
        setEditingId(null)
        setIsCreating(false)
        setFormData({ name: '', icon: 'Tag', color: 'blue' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Block names that duplicate a system category
        const existsInSystem = systemCategories.some(
            c => c.name.toLowerCase() === formData.name.trim().toLowerCase()
        )
        if (existsInSystem) {
            alert(`"${formData.name}" ya existe como categoría del sistema. Elegí otro nombre.`)
            return
        }

        setActionLoading(true)
        try {
            if (isCreating) {
                const { error } = await supabase.from('categories').insert([{
                    ...formData,
                    user_id: user.id
                }])
                if (error) throw error
            } else {
                const { error } = await supabase.from('categories')
                    .update(formData)
                    .eq('id', editingId)
                if (error) throw error
            }
            await refreshCategories()
            handleCancel()
        } catch (error) {
            console.error('Error saving category:', error)
            alert('Error al guardar la categoría')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta categoría? Se desvinculará de las transacciones existentes.')) return
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id)
            if (error) throw error
            await refreshCategories()
        } catch (error) {
            console.error('Error deleting:', error)
            alert('Error al eliminar')
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="p-4 pb-20 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Tus Categorías</h1>
            </div>

            <div className="mb-6 flex justify-end">
                {!isCreating && !editingId && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                        <Plus size={18} /> Nueva Categoría
                    </button>
                )}
            </div>

            {(isCreating || editingId) && (
                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
                    <h2 className="font-bold text-lg mb-4">{isCreating ? 'Nueva Categoría' : 'Editar Categoría'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Ej: Comida"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map(c => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: c.name })}
                                        className={`w-8 h-8 rounded-full ${c.bg} transition-transform ${formData.color === c.name ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                            >
                                {actionLoading && <Loader2 className="animate-spin" size={14} />}
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {userCategories.length === 0 && !isCreating ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                        <Sparkles size={28} className="text-blue-500" />
                    </div>
                    <p className="font-semibold text-gray-700 mb-1">Aún no tenés categorías personalizadas</p>
                    <p className="text-sm text-gray-400 mb-5">
                        Las categorías del sistema (Vivienda, Alimentación, etc.) ya están disponibles al registrar una transacción.
                    </p>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                        <Plus size={18} /> Crear categoría
                    </button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {userCategories.map(cat => {
                        const color = getColor(cat.color)
                        return (
                            <div key={cat.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full ${color.light} flex items-center justify-center ${color.text}`}>
                                        <Tag size={20} />
                                    </div>
                                    <span className="font-medium text-gray-900">{cat.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
