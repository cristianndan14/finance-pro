import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import { useAccounts } from '../hooks/useAccounts'
import { Plus, Loader2, Target, TrendingUp, Calendar, Users, Trash2, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ShareModal from '../components/ui/ShareModal'
import CurrencyInput from '../components/ui/CurrencyInput'

export default function GoalsPage() {
    const { goals, loading, createGoal, deleteGoal } = useGoals()
    const { accounts, loading: accountsLoading } = useAccounts()
    const navigate = useNavigate()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        target_amount: '',
        deadline: '',
        account_id: '',
    })
    const [submitting, setSubmitting] = useState(false)
    const [sharingGoal, setSharingGoal] = useState(null)

    // Accounts valid for saving: exclude credit cards
    const savingsAccounts = accounts.filter(a => a.type !== 'credit')

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!formData.account_id) {
            alert('Debes seleccionar una cuenta donde ahorrar.')
            return
        }
        setSubmitting(true)
        try {
            await createGoal(
                {
                    name: formData.name,
                    target_amount: parseFloat(formData.target_amount) || 0,
                    deadline: formData.deadline || null,
                },
                formData.account_id
            )
            setShowCreateModal(false)
            setFormData({ name: '', target_amount: '', deadline: '', account_id: '' })
        } catch (error) {
            console.error(error)
            alert(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading || accountsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="p-4 pb-24">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mis Metas</h1>
                    <p className="text-sm text-gray-500">Tus objetivos de ahorro</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    disabled={savingsAccounts.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Plus size={18} />
                    Nueva
                </button>
            </div>

            {/* No debit accounts: full-page prompt */}
            {savingsAccounts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="text-amber-500" size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Necesitás una cuenta primero</h3>
                    <p className="text-gray-500 mb-6 max-w-xs mx-auto text-sm">
                        Para crear metas necesitás tener al menos una cuenta de débito registrada (banco, billetera o efectivo).
                    </p>
                    <button
                        onClick={() => navigate('/?action=create-account')}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Crear una cuenta
                    </button>
                </div>
            ) : goals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-blue-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="text-blue-600" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sin metas aún</h3>
                    <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                        Crea una meta y asocia una de tus cuentas para empezar a medir tu progreso.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Crear Meta
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {goals.map((goal) => {
                        const progress = goal.target_amount
                            ? Math.min((goal.totalSaved / goal.target_amount) * 100, 100)
                            : 0
                        const currency = goal.myAccount?.currency || 'ARS'

                        return (
                            <div
                                key={goal.id}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                                onClick={() => navigate(`/goals/${goal.id}`)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                                            <TrendingUp size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{goal.name}</h3>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Users size={12} />
                                                <span>{goal.participants.length} participante{goal.participants.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">
                                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(goal.totalSaved)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            de {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(goal.target_amount)}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <span className="text-xs font-semibold text-green-600">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                                        <div
                                            style={{ width: `${progress}%` }}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-50">
                                    {goal.deadline ? (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar size={14} />
                                            <span>Meta: {new Date(goal.deadline).toLocaleDateString()}</span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-400">Sin fecha límite</div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSharingGoal(goal)
                                            }}
                                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50"
                                        >
                                            <Users size={13} />
                                            Compartir
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation()
                                                if (window.confirm('¿Eliminar esta meta? Las cuentas asociadas no se verán afectadas.')) {
                                                    await deleteGoal(goal.id)
                                                }
                                            }}
                                            className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                        <ChevronRight size={16} className="text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create Goal Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Nueva Meta de Ahorro</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <Plus className="rotate-45" size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Meta</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Viaje a Japón"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Objetivo</label>
                                <CurrencyInput
                                    required
                                    value={formData.target_amount}
                                    onChange={val => setFormData({ ...formData, target_amount: val })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cuenta para Ahorrar <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.account_id}
                                    onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar cuenta...</option>
                                    {savingsAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.currency}) — {new Intl.NumberFormat('es-AR', { style: 'currency', currency: acc.currency }).format(acc.current_balance)}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Solo se muestran cuentas no crediticias.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite (Opcional)</label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Creando...' : 'Crear Meta'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            {sharingGoal && (
                <ShareModal
                    isOpen={!!sharingGoal}
                    onClose={() => setSharingGoal(null)}
                    resourceType="goal"
                    resourceId={sharingGoal.id}
                    resourceName={sharingGoal.name}
                />
            )}
        </div>
    )
}
