import { useState, useEffect } from 'react'
import { X, ArrowRight, Wallet, ArrowLeft } from 'lucide-react'
import { useAccounts } from '../../hooks/useAccounts'
import { useTransactions } from '../../hooks/useTransactions'
import CurrencyInput from './CurrencyInput'

export default function TransferModal({ isOpen, onClose, preselectedSourceId, preselectedTargetId }) {
    const { accounts } = useAccounts()
    const { createTransfer } = useTransactions()
    const [loading, setLoading] = useState(false)

    // We use a local state that initializes with props but allows changing
    const [sourceId, setSourceId] = useState(preselectedSourceId || '')
    const [targetId, setTargetId] = useState(preselectedTargetId || '')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')

    // Reset state when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            setSourceId(preselectedSourceId || '')
            setTargetId(preselectedTargetId || '')
            setAmount('')
            setDescription('')
        }
    }, [isOpen, preselectedSourceId, preselectedTargetId])

    if (!isOpen) return null

    const targetAccount = accounts.find(acc => acc.id === targetId)
    const isPaymentMode = targetAccount?.type === 'credit'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (!sourceId) throw new Error('Selecciona cuenta origen')
            if (!targetId) throw new Error('Selecciona cuenta destino')
            if (sourceId === targetId) throw new Error('Origen y destino no pueden ser iguales')

            await createTransfer({
                sourceAccountId: sourceId,
                targetAccountId: targetId,
                amount: parseFloat(amount),
                description: description || (isPaymentMode ? 'Pago de tarjeta' : 'Transferencia interna')
            })
            onClose()
        } catch (error) {
            console.error(error)
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Filter accounts based on mode
    const sourceAccounts = accounts.filter(acc => {
        if (isPaymentMode) return acc.type === 'bank' || acc.type === 'wallet' // Strictly debit accounts
        return acc.id !== targetId
    })

    const targetAccounts = accounts.filter(acc => acc.id !== sourceId)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isPaymentMode ? 'Pagar Tarjeta' : 'Transferir Dinero'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isPaymentMode ? 'Monto a pagar' : 'Monto a transferir'}
                        </label>
                        <div className="relative">
                            <CurrencyInput
                                required
                                value={amount}
                                onChange={val => setAmount(val)}
                                placeholder="0.00"
                                className="!py-3 !text-2xl font-bold !rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Source & Target Selection */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        {/* Source */}
                        <div>
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Desde (Origen)</label>
                            <select
                                value={sourceId}
                                onChange={e => setSourceId(e.target.value)}
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                                required
                            >
                                <option value="">Seleccionar origen</option>
                                {sourceAccounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({new Intl.NumberFormat('es-AR', { style: 'currency', currency: acc.currency || 'ARS' }).format(acc.current_balance)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {!isPaymentMode ? (
                            <>
                                <div className="flex justify-center -my-2 relative z-10">
                                    <div className="bg-white p-1.5 rounded-full border border-gray-200 text-gray-400 shadow-sm">
                                        <ArrowLeft className="rotate-[-90deg]" size={16} />
                                    </div>
                                </div>

                                {/* Target */}
                                <div>
                                    <label className="text-xs text-gray-500 font-medium mb-1 block">Hacia (Destino)</label>
                                    <select
                                        value={targetId}
                                        disabled={!!preselectedTargetId}
                                        onChange={e => setTargetId(e.target.value)}
                                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                        required
                                    >
                                        <option value="">Seleccionar destino</option>
                                        {targetAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({new Intl.NumberFormat('es-AR', { style: 'currency', currency: acc.currency || 'ARS' }).format(acc.current_balance)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500 font-medium mb-1">Pagando a (Destino)</p>
                                <div className="flex items-center gap-2 text-blue-600">
                                    <Wallet size={16} />
                                    <span className="font-bold text-sm">{targetAccount?.name}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Nota (Opcional)"
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : (isPaymentMode ? 'Confirmar Pago' : 'Confirmar Transferencia')}
                    </button>
                </form>
            </div>
        </div>
    )
}
