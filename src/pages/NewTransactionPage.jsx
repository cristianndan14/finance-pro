import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useAccounts } from '../hooks/useAccounts'
import { useTransactions } from '../hooks/useTransactions'
import { useRecurringTransactions } from '../hooks/useRecurringTransactions'
import { ArrowLeft, Loader2, Wallet } from 'lucide-react'

export default function NewTransactionPage() {
    const navigate = useNavigate()
    const { budgets } = useBudgets()
    const { accounts, loading: accountsLoading } = useAccounts()
    const { createTransaction } = useTransactions()
    const { createRecurringTransaction } = useRecurringTransactions()

    const [formData, setFormData] = useState({
        budget_id: '',
        category_id: '',
        account_id: '',
        type: 'egreso',
        amount: '',
        description: '',
        isRecurring: false,
        frequency: 'monthly',
        is_automatic: true,
        installments: 1, // Default to 1 installment
    })
    const [loading, setLoading] = useState(false)

    const { categories, systemCategories, userCategories } = useCategories()

    if (accountsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (accounts.length === 0) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="bg-blue-100 p-4 rounded-full mb-4">
                    <Wallet size={32} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No tienes cuentas</h2>
                <p className="text-gray-500 mb-6">
                    Para registrar una transacción, primero necesitas crear una cuenta (Billetera, Banco, Efectivo).
                </p>
                <button
                    onClick={() => navigate('/?action=create-account')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                    Crear mi primera cuenta
                </button>
            </div>
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const selectedAccount = accounts.find(a => a.id === formData.account_id)
            const amount = parseFloat(formData.amount)

            // Limit Check for Credit Cards
            if (selectedAccount?.type === 'credit' && formData.type === 'egreso') {
                const totalDebt = Math.abs(selectedAccount.current_balance || 0)

                // Fetch transactions for this account to separate debt
                const { data: txs } = await supabase
                    .from('transactions')
                    .select('amount, created_at, installments_count')
                    .or(`account_id.eq.${selectedAccount.id},transfer_target_id.eq.${selectedAccount.id}`)

                let futureInstallmentDebt = 0
                txs?.forEach(t => {
                    if (t.installments_count > 1) {
                        const txDate = new Date(t.created_at)
                        const now = new Date()
                        if (txDate.getFullYear() > now.getFullYear() || (txDate.getFullYear() === now.getFullYear() && txDate.getMonth() > now.getMonth())) {
                            futureInstallmentDebt += (t.amount || 0)
                        }
                    }
                })

                const singlePaymentDebt = Math.max(0, totalDebt - futureInstallmentDebt)
                const installments = formData.installments || 1
                const isUnified = !selectedAccount.installments_limit

                if (isUnified) {
                    const available = (parseFloat(selectedAccount.credit_limit) || 0) - totalDebt
                    if (amount > available) {
                        alert(`El monto excede el límite disponible unificado (${new Intl.NumberFormat('es-AR', { style: 'currency', currency: selectedAccount.currency || 'ARS' }).format(available)})`)
                        setLoading(false)
                        return
                    }
                } else {
                    if (installments === 1) {
                        const availableSingle = (parseFloat(selectedAccount.credit_limit) || 0) - singlePaymentDebt
                        if (amount > availableSingle) {
                            alert(`El monto excede el límite disponible para 1 pago (${new Intl.NumberFormat('es-AR', { style: 'currency', currency: selectedAccount.currency || 'ARS' }).format(availableSingle)})`)
                            setLoading(false)
                            return
                        }
                    } else {
                        const limit = parseFloat(selectedAccount.installments_limit) || parseFloat(selectedAccount.credit_limit) || 0
                        const availableInstallments = limit - totalDebt
                        if (amount > availableInstallments) {
                            alert(`El monto total excede el límite disponible para cuotas (${new Intl.NumberFormat('es-AR', { style: 'currency', currency: selectedAccount.currency || 'ARS' }).format(availableInstallments)})`)
                            setLoading(false)
                            return
                        }
                    }
                }
            }

            const commonData = {
                budget_id: formData.budget_id || null,
                category_id: formData.category_id || null,
                account_id: formData.account_id,
                type: formData.type,
                description: formData.description,
            }

            // Recurring Logic
            if (formData.isRecurring) {
                // ... (Existing recurring logic)
                let nextDate = new Date()
                switch (formData.frequency) {
                    case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
                    case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                    case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                    case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
                }

                await createRecurringTransaction({
                    ...commonData,
                    amount: amount, // Full amount for recurring? Or is recurring usually fixed? Assuming single amount.
                    frequency: formData.frequency,
                    next_execution_date: nextDate.toISOString().split('T')[0],
                    status: 'active',
                    is_automatic: formData.is_automatic
                })

                // Also create the first one immediately? Usually yes.
            }

            // Installments Logic (Only for Credit Cards + Egreso + Not Recurring)
            if (selectedAccount?.type === 'credit' && formData.type === 'egreso' && !formData.isRecurring && formData.installments > 1) {
                const installments = formData.installments
                const amountPerInstallment = amount / installments
                const installmentGroupId = crypto.randomUUID()
                const transactionsToCreate = []

                for (let i = 0; i < installments; i++) {
                    const date = new Date()
                    date.setMonth(date.getMonth() + i)

                    // Optional: Adjust day to closing/due day? 
                    // For now, simpler: just same day of next months. 
                    // If current day > 28, this might jump months (e.g. Jan 31 -> Feb 28/29 -> Mar 31).
                    // Javascript setMonth handles overflow by going to next month, which is technically correct for "30 days later" roughly, 
                    // but "same day" expectation might be tricky. 
                    // Let's stick to standard `setMonth` behavior for MVP.

                    transactionsToCreate.push({
                        ...commonData,
                        amount: amountPerInstallment,
                        created_at: date.toISOString(), // Future dates
                        installments_count: installments,
                        installment_number: i + 1,
                        installment_group_id: installmentGroupId,
                        description: formData.description || ''
                    })
                }

                await createTransaction(transactionsToCreate)

            } else {
                // Standard Single Transaction
                await createTransaction({
                    ...commonData,
                    amount: amount,
                    installments_count: 1,
                    installment_number: 1
                })
            }

            navigate('/')
        } catch (error) {
            console.error('Error creating transaction:', error)
            alert(error.message || 'Error al crear la transacción')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 pb-20">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Nueva Transacción</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'egreso' })}
                            className={`px-4 py-3 rounded-lg font-medium transition-all ${formData.type === 'egreso'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Egreso
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'ingreso' })}
                            className={`px-4 py-3 rounded-lg font-medium transition-all ${formData.type === 'ingreso'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Ingreso
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                </div>

                <div className="grid gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cuenta
                        </label>
                        <select
                            required
                            value={formData.account_id}
                            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="">Seleccionar cuenta</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} ({account.currency})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Presupuesto (Opcional)
                    </label>
                    <select
                        value={formData.budget_id}
                        onChange={(e) => setFormData({ ...formData, budget_id: e.target.value, category_id: '' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Sin presupuesto</option>
                        {budgets.map((budget) => (
                            <option key={budget.id} value={budget.id}>
                                {budget.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría
                    </label>
                    <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Sin categoría</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción (Opcional)
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ej: Compra en supermercado"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Installments Section for Credit Cards */}
                {(() => {
                    const selectedAccount = accounts.find(a => a.id === formData.account_id)
                    if (selectedAccount?.type === 'credit' && formData.type === 'egreso' && !formData.isRecurring) {
                        return (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3 animate-in fade-in">
                                <label className="block text-sm font-medium text-blue-900 mb-1">
                                    Cuotas
                                </label>
                                <select
                                    value={formData.installments || 1}
                                    onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    {[1, 3, 6, 9, 12, 18, 24].map(n => (
                                        <option key={n} value={n}>{n} {n === 1 ? 'cuota' : 'cuotas'} {n > 1 ? 'fijas' : ''}</option>
                                    ))}
                                </select>
                                {formData.installments > 1 && (
                                    <p className="text-sm text-blue-700 font-medium">
                                        Monto por cuota: {new Intl.NumberFormat('es-AR', { style: 'currency', currency: selectedAccount.currency || 'ARS' }).format(formData.amount / formData.installments)}
                                    </p>
                                )}
                            </div>
                        )
                    }
                })()}

                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">
                            Repetir Transacción
                        </label>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={formData.isRecurring}
                            onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
                            className={`${formData.isRecurring ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                        >
                            <span
                                aria-hidden="true"
                                className={`${formData.isRecurring ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                        </button>
                    </div>
                </div>

                {formData.isRecurring && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                Frecuencia
                            </label>
                            <select
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="daily">Diaria</option>
                                <option value="weekly">Semanal</option>
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                Tipo de Procesamiento
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_automatic: true })}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${formData.is_automatic
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
                                        }`}
                                >
                                    Automático
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_automatic: false })}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-all ${!formData.is_automatic
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
                                        }`}
                                >
                                    Manual
                                </button>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                {formData.is_automatic
                                    ? 'La app creará la transacción automáticamente cuando llegue la fecha.'
                                    : 'La app te avisará, pero tú deberás confirmar la transacción.'}
                            </p>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="animate-spin" size={20} />}
                    {loading ? 'Guardando...' : 'Guardar Transacción'}
                </button>
            </form>
        </div>
    )
}
