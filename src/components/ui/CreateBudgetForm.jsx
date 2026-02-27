import { useState, useEffect } from 'react'
import { X, Wallet } from 'lucide-react'
import CurrencyInput from './CurrencyInput'

export default function CreateBudgetForm({ initialData, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        monthly_limit: '',
        base_currency: 'ARS',
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                monthly_limit: initialData.monthly_limit || '',
                base_currency: initialData.base_currency,
            })
        }
    }, [initialData])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const dataToSubmit = {
                ...formData,
                type: 'gasto', // Force all budgets to be expenses
                monthly_limit: formData.monthly_limit ? parseFloat(formData.monthly_limit) : null,
                account_id: null, // No linked accounts for expense budgets
            }
            await onSubmit(dataToSubmit)
            setFormData({ name: '', monthly_limit: '', base_currency: 'ARS' })
        } catch (error) {
            console.error('Error creating budget:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej: Gastos Mensuales, Vacaciones"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Límite Mensual (Opcional)
                        </label>
                        <CurrencyInput
                            value={formData.monthly_limit}
                            onChange={(val) => setFormData({ ...formData, monthly_limit: val })}
                            placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Deja en blanco si es un presupuesto sin límite fijo.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Moneda
                        </label>
                        <select
                            value={formData.base_currency}
                            onChange={(e) => setFormData({ ...formData, base_currency: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ARS">ARS (Peso Argentino)</option>
                            <option value="USD">USD (Dólar)</option>
                            <option value="EUR">EUR (Euro)</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Presupuesto')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
