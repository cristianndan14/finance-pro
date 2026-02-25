import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function CreateAccountForm({ initialData, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'bank',
        current_balance: 0,
        currency: 'ARS',
    })
    const [loading, setLoading] = useState(false)

    const [isUnifiedLimit, setIsUnifiedLimit] = useState(true)

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                type: initialData.type,
                current_balance: initialData.current_balance,
                currency: initialData.currency,
                credit_limit: initialData.credit_limit,
                installments_limit: initialData.installments_limit,
                closing_day: initialData.closing_day,
                due_day: initialData.due_day,
            })
            setIsUnifiedLimit(initialData.installments_limit === null || initialData.installments_limit === undefined)
        }
    }, [initialData])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const dataToSubmit = {
                ...formData,
                current_balance: formData.type === 'credit'
                    ? -Math.abs(formData.current_balance)
                    : formData.current_balance,
                installments_limit: isUnifiedLimit ? null : formData.installments_limit
            }
            await onSubmit(dataToSubmit)
            setFormData({ name: '', type: 'bank', current_balance: 0, currency: 'ARS' })
        } catch (error) {
            console.error('Error saving account:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Editar Cuenta' : 'Nueva Cuenta'}
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
                            placeholder="Ej: Santander, Efectivo, Mercado Pago"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="bank">Banco</option>
                            <option value="wallet">Billetera Digital</option>
                            <option value="cash">Efectivo</option>
                            <option value="crypto">Crypto</option>
                            <option value="credit">Tarjeta de Crédito</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {formData.type === 'credit' ? 'Deuda Actual' : (initialData ? 'Saldo Actual' : 'Saldo Inicial')}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={formData.current_balance}
                            onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) })}
                            placeholder={formData.type === 'credit' ? "50000.00" : "0.00"}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {formData.type === 'credit' && (
                        <>
                            <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-lg border border-blue-100 mb-2">
                                <input
                                    type="checkbox"
                                    id="isUnifiedLimit"
                                    checked={isUnifiedLimit}
                                    onChange={(e) => setIsUnifiedLimit(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="isUnifiedLimit" className="text-sm font-medium text-blue-900 cursor-pointer">
                                    Límite Unificado (Un solo límite para todo)
                                </label>
                            </div>

                            <div className={isUnifiedLimit ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {isUnifiedLimit ? 'Límite de Crédito' : 'Límite 1 Pago'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.credit_limit || ''}
                                        onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                {!isUnifiedLimit && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Límite Cuotas
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required={!isUnifiedLimit}
                                            value={formData.installments_limit || ''}
                                            onChange={(e) => setFormData({ ...formData, installments_limit: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cierre (Día)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.closing_day || ''}
                                        onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                                        placeholder="Ej: 25"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vencimiento (Día)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.due_day || ''}
                                        onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                                        placeholder="Ej: 5"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Moneda
                        </label>
                        <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
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
                            {loading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Cuenta')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
