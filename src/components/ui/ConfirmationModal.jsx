import { X } from 'lucide-react'

export default function ConfirmationModal({ isOpen, onConfirm, onCancel, transaction }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Confirmar Transacción</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span className={`font-medium ${transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {transaction.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Monto:</span>
                        <span className="font-bold text-gray-900">
                            ${transaction.amount}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Presupuesto:</span>
                        <span className="font-medium text-gray-900">{transaction.budgetName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Categoría:</span>
                        <span className="font-medium text-gray-900">{transaction.categoryName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Cuenta:</span>
                        <span className="font-medium text-gray-900">{transaction.accountName}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    )
}
