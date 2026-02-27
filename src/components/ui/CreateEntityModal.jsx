import { useState } from 'react'
import { X, Building } from 'lucide-react'
import { useEntities } from '../../hooks/useEntities'

export default function CreateEntityModal({ onClose, onSuccess }) {
    const [name, setName] = useState('')
    const { addEntity, loading } = useEntities()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!name.trim()) return

        try {
            const newEntity = await addEntity({ name: name.trim() })
            if (onSuccess) onSuccess(newEntity)
            onClose()
        } catch (error) {
            console.error('Error creating entity:', error)
            alert('Error al crear la entidad: ' + error.message)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Building size={24} />
                        <h2 className="text-xl font-bold text-gray-900">Nueva Entidad</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de la Entidad
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Banco Galicia, Mercado Pago"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Una entidad agrupa varios de tus productos financieros (caja de ahorro, tarjetas, etc.) bajo un mismo nombre.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creando...' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
