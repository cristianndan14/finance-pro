import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecurringTransactions } from '../hooks/useRecurringTransactions'
import { useTransactions } from '../hooks/useTransactions'
import { ArrowLeft, Loader2, Calendar, Clock, CheckCircle2, AlertCircle, PlayCircle, PauseCircle, Trash2 } from 'lucide-react'

export default function RecurringPage() {
    const navigate = useNavigate()
    const {
        recurringTransactions,
        loading,
        updateRecurringTransaction,
        deleteRecurringTransaction
    } = useRecurringTransactions()
    const { createTransaction } = useTransactions()

    const [confirmingId, setConfirmingId] = useState(null)

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const today = new Date().toISOString().split('T')[0]

    // Filter pending manual transactions
    const pendingManuals = recurringTransactions.filter(t =>
        !t.is_automatic &&
        t.status === 'active' &&
        t.next_execution_date <= today
    )

    // Regular list (everything else or all)
    const activeRules = recurringTransactions.filter(t => t.status === 'active')
    const pausedRules = recurringTransactions.filter(t => t.status === 'paused')

    const handleConfirmManual = async (rule) => {
        if (!confirm('¿Confirmar y registrar esta transacción por ' + rule.amount + '?')) return
        setConfirmingId(rule.id)
        try {
            // 1. Create transaction
            await createTransaction({
                budget_id: rule.budget_id,
                category_id: rule.category_id,
                account_id: rule.account_id,
                amount: rule.amount,
                type: rule.type,
                description: rule.description || 'Transacción Recurrente Manual',
                recurring_id: rule.id
            })

            // 2. Update next date
            let nextDate = new Date(rule.next_execution_date)
            switch (rule.frequency) {
                case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
                case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
            }

            await updateRecurringTransaction(rule.id, {
                next_execution_date: nextDate.toISOString().split('T')[0]
            })

            alert('¡Transacción registrada exitosamente!')
        } catch (error) {
            console.error(error)
            alert('Error al confirmar')
        } finally {
            setConfirmingId(null)
        }
    }

    const handleDelete = async (id) => {
        if (confirm('¿Eliminar esta regla recurrente?')) {
            await deleteRecurringTransaction(id)
        }
    }

    const RuleCard = ({ rule, isPending = false }) => (
        <div className={`p-4 rounded-xl border mb-3 ${isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-gray-900">{rule.description || 'Sin descripción'}</h3>
                    <p className="text-sm text-gray-500">
                        {rule.category?.name || 'Sin categoría'} • {rule.account?.name}
                    </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold ${rule.type === 'ingreso' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    ${rule.amount}
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{rule.frequency === 'monthly' ? 'Mensual' : rule.frequency}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span>Próximo: {new Date(rule.next_execution_date).toLocaleDateString()}</span>
                </div>
                {!rule.is_automatic && (
                    <span className="text-orange-600 bg-orange-100 px-1 py-0.5 rounded">Manual</span>
                )}
            </div>

            <div className="flex gap-2 justify-end">
                {isPending ? (
                    <button
                        onClick={() => handleConfirmManual(rule)}
                        disabled={confirmingId === rule.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
                    >
                        {confirmingId === rule.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                        Confirmar Pago
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => updateRecurringTransaction(rule.id, { status: rule.status === 'active' ? 'paused' : 'active' })}
                            className={`p-2 rounded-lg transition-colors ${rule.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                            title={rule.status === 'active' ? 'Pausar' : 'Reactivar'}
                        >
                            {rule.status === 'active' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                        </button>
                        <button
                            onClick={() => handleDelete(rule.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </>
                )}
            </div>
        </div>
    )

    return (
        <div className="p-4 pb-20">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Pagos Recurrentes</h1>
            </div>

            {pendingManuals.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertCircle size={18} className="text-yellow-500" />
                        Pendientes de Confirmación
                    </h2>
                    {pendingManuals.map(rule => (
                        <RuleCard key={rule.id} rule={rule} isPending={true} />
                    ))}
                </div>
            )}

            <div className="mb-6">
                <h2 className="text-md font-bold text-gray-900 mb-3">Activos</h2>
                {activeRules.filter(t => !pendingManuals.includes(t)).length === 0 ? (
                    <p className="text-gray-400 text-sm">No hay pagos recurrentes activos habituales.</p>
                ) : (
                    activeRules.filter(t => !pendingManuals.includes(t)).map(rule => (
                        <RuleCard key={rule.id} rule={rule} />
                    ))
                )}
            </div>

            {pausedRules.length > 0 && (
                <div className="opacity-75">
                    <h2 className="text-md font-bold text-gray-900 mb-3">Pausados</h2>
                    {pausedRules.map(rule => (
                        <RuleCard key={rule.id} rule={rule} />
                    ))}
                </div>
            )}
        </div>
    )
}
