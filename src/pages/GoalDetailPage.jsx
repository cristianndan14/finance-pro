import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGoals } from '../hooks/useGoals'
import { useAccounts } from '../hooks/useAccounts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
    ArrowLeft, Loader2, Calendar, Users,
    Target, Trash2, ArrowRightLeft, Edit3, Plus
} from 'lucide-react'
import TransferModal from '../components/ui/TransferModal'
import ShareModal from '../components/ui/ShareModal'
import CurrencyInput from '../components/ui/CurrencyInput'

export default function GoalDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { goals, loading, deleteGoal, updateGoal, updateGoalAccount } = useGoals()
    const { accounts } = useAccounts()

    const [transactions, setTransactions] = useState([])
    const [txLoading, setTxLoading] = useState(true)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [sharingGoal, setSharingGoal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editFormData, setEditFormData] = useState({ name: '', target_amount: '', deadline: '', account_id: '' })
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
    const [editError, setEditError] = useState('')

    const goal = goals.find(g => g.id === id)
    const isCreator = goal?.user_id === user?.id
    const savingsAccounts = accounts.filter(a => a.type !== 'credit')

    // Filter available accounts: the ones not in any other goal, plus the current one
    const availableAccounts = savingsAccounts.filter(acc => {
        if (goal && acc.id === goal.account_id) return true
        return !goals.some(g => g.id !== goal?.id && g.account_id === acc.id)
    })

    const handleOpenEdit = () => {
        setEditFormData({
            name: goal.name,
            target_amount: goal.target_amount || '',
            deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
            account_id: goal.account_id || ''
        })
        setEditError('')
        setShowEditModal(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setEditError('')

        const newAmount = parseFloat(editFormData.target_amount)
        if (newAmount < goal.target_amount) {
            setEditError(`El nuevo monto no puede ser menor al actual (${new Intl.NumberFormat('es-AR', { style: 'currency', currency: goal.myAccount?.currency || 'ARS' }).format(goal.target_amount)}).`)
            return
        }

        setIsSubmittingEdit(true)
        try {
            await updateGoal(goal.id, {
                name: editFormData.name,
                target_amount: newAmount,
                deadline: editFormData.deadline || null,
                account_id: editFormData.account_id
            })
            setShowEditModal(false)
        } catch (err) {
            setEditError(err.message)
        } finally {
            setIsSubmittingEdit(false)
        }
    }

    // Fetch transactions of all participant accounts
    useEffect(() => {
        if (!goal) return
        const fetchTransactions = async () => {
            setTxLoading(true)
            try {
                const accountId = goal.myAccount?.id
                if (!accountId) {
                    setTransactions([])
                    return
                }

                // Transfers store the destination in transfer_target_id, not account_id.
                // We need both to capture all movements related to the linked account.
                const { data, error } = await supabase
                    .from('transactions')
                    .select(`
                        *,
                        category:categories(name),
                        account:accounts!account_id(name, currency)
                    `)
                    .or(`account_id.eq.${accountId},transfer_target_id.eq.${accountId}`)
                    .order('created_at', { ascending: false })
                    .limit(50)

                if (error) throw error
                setTransactions(data || [])
            } catch (err) {
                console.error('Error fetching goal transactions:', err)
            } finally {
                setTxLoading(false)
            }
        }
        fetchTransactions()
    }, [goal?.id, goal?.account_id])


    const handleDelete = async () => {
        if (window.confirm('¿Eliminar esta meta? Las cuentas asociadas no se verán afectadas.')) {
            await deleteGoal(id)
            navigate('/goals')
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!goal) {
        return (
            <div className="p-4">
                <button onClick={() => navigate('/goals')} className="flex items-center gap-2 text-gray-600 mb-4">
                    <ArrowLeft size={18} /> Volver
                </button>
                <p className="text-gray-500">Meta no encontrada.</p>
            </div>
        )
    }

    const currency = goal.myAccount?.currency || 'ARS'
    const progress = goal.target_amount ? Math.min((goal.totalSaved / goal.target_amount) * 100, 100) : 0

    return (
        <div className="p-4 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/goals')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{goal.name}</h1>
                        <p className="text-sm text-gray-500">Meta de ahorro</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSharingGoal(true)}
                        className="p-2 hover:bg-blue-50 rounded-full text-blue-600 transition-colors"
                        title="Compartir"
                    >
                        <Users size={20} />
                    </button>
                    {isCreator && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleOpenEdit}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                                title="Editar meta"
                            >
                                <Edit3 size={20} />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                                title="Eliminar meta"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
                <div className="text-center mb-6">
                    <p className="text-sm font-medium opacity-90 uppercase tracking-wider mb-1">Ahorro Total</p>
                    <p className="text-4xl font-bold">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(goal.totalSaved)}
                    </p>
                    <p className="text-sm opacity-75 mt-1">
                        de {new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(goal.target_amount)}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs opacity-80 mb-1">
                        <span>Progreso</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-700 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {goal.deadline && (
                    <div className="flex items-center justify-center gap-2 text-sm opacity-80">
                        <Calendar size={14} />
                        <span>Fecha límite: {new Date(goal.deadline).toLocaleDateString('es-AR')}</span>
                    </div>
                )}

                {/* Ingresar Dinero button */}
                {goal.myAccount && (
                    <button
                        onClick={() => setShowTransferModal(true)}
                        className="mt-5 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm flex items-center justify-center gap-2"
                    >
                        <ArrowRightLeft size={16} />
                        Ingresar Dinero a {goal.myAccount.name}
                    </button>
                )}
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Cuenta vinculada</h2>
                {goal.myAccount ? (
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                                Yo
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 text-sm">Tu aporte</p>
                                <p className="text-xs text-gray-500">{goal.myAccount.name}</p>
                            </div>
                        </div>
                        <p className="font-bold text-green-600 text-sm">
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: goal.myAccount.currency || 'ARS' }).format(goal.myAccount.current_balance || 0)}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400">Sin cuenta asociada</p>
                )}
            </div>

            {/* Transactions */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Movimientos de la Cuenta</h2>
                {txLoading ? (
                    <div className="flex justify-center py-6">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Target size={28} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Aún no hay movimientos registrados</p>
                        <p className="text-gray-400 text-xs mt-1">Los movimientos de la cuenta asociada aparecerán aquí</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((t) => {
                            const isIncoming = t.transfer_target_id === goal.myAccount?.id
                            const isPositive = t.type === 'ingreso' || isIncoming
                            const label = t.is_transfer
                                ? (isIncoming ? 'Transferencia recibida' : 'Transferencia enviada')
                                : (t.description || t.category?.name || (isPositive ? 'Ingreso' : 'Egreso'))
                            return (
                                <div key={t.id} onClick={() => navigate(`/transactions/${t.id}`)} className="bg-white border border-gray-100 rounded-xl p-4 flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md active:scale-[0.99] transition-all">
                                    <div className="flex-1 mr-4 overflow-hidden">
                                        <p className="font-medium text-gray-900 truncate text-sm">{label}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                            <span>{t.account?.name}</span>
                                            <span>·</span>
                                            <span>{new Date(t.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                    </div>
                                    <p className={`font-bold whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                                        {isPositive ? '+' : '-'} {new Intl.NumberFormat('es-AR', { style: 'currency', currency: t.account?.currency || 'ARS' }).format(t.amount)}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Transfer Modal */}
            {goal.myAccount && (
                <TransferModal
                    isOpen={showTransferModal}
                    onClose={() => setShowTransferModal(false)}
                    preselectedTargetId={goal.myAccount.id}
                />
            )}

            {/* Share Modal */}
            {sharingGoal && (
                <ShareModal
                    isOpen={sharingGoal}
                    onClose={() => setSharingGoal(false)}
                    resourceType="goal"
                    resourceId={goal.id}
                    resourceName={goal.name}
                />
            )}
            {/* Edit Goal Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Editar Meta</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <Plus className="rotate-45" size={20} />
                            </button>
                        </div>

                        {editError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                                {editError}
                            </div>
                        )}

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Meta</label>
                                <input
                                    required
                                    type="text"
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Objetivo</label>
                                <CurrencyInput
                                    required
                                    value={editFormData.target_amount}
                                    onChange={val => {
                                        setEditFormData({ ...editFormData, target_amount: val })
                                        setEditError('')
                                    }}
                                />
                                <p className="text-xs text-blue-600 mt-1">Solo puedes incrementar el monto actual ({new Intl.NumberFormat('es-AR', { style: 'currency', currency: goal.myAccount?.currency || 'ARS' }).format(goal.target_amount)}).</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cuenta para Ahorrar <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={editFormData.account_id}
                                    onChange={e => setEditFormData({ ...editFormData, account_id: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar cuenta...</option>
                                    {availableAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.currency})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite (Opcional)</label>
                                <input
                                    type="date"
                                    value={editFormData.deadline}
                                    onChange={e => setEditFormData({ ...editFormData, deadline: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingEdit}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmittingEdit ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
