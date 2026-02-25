import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useAccounts } from '../../hooks/useAccounts'

export default function CreateAccountModal({ isOpen, onClose }) {
  const { createAccount } = useAccounts()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank',
    initialBalance: 0,
    currency: 'ARS'
  })

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await createAccount(formData)
    setLoading(false)
    if (result.success) {
      onClose()
      setFormData({ name: '', type: 'bank', initialBalance: 0, currency: 'ARS' })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nueva Cuenta</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ej: Banco Galicia"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="bank">Banco</option>
                <option value="wallet">Billetera Virtual</option>
                <option value="cash">Efectivo</option>
                <option value="crypto">Cripto</option>
                <option value="credit">Tarjeta de Crédito</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo {formData.type === 'credit' ? 'Actual (Deuda)' : 'Inicial'}</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder={formData.type === 'credit' ? "-50000.00" : "0.00"}
              value={formData.initialBalance}
              onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
            />
            {formData.type === 'credit' && <p className="text-xs text-gray-500 mt-1">Ingrese un valor negativo si ya tiene deuda acumulada.</p>}
          </div>

          {formData.type === 'credit' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Crédito</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ej: 500000.00"
                  value={formData.credit_limit || ''}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cierra el día</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="Ej: 25"
                    value={formData.closing_day || ''}
                    onChange={(e) => setFormData({ ...formData, closing_day: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vence el día</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    placeholder="Ej: 5"
                    value={formData.due_day || ''}
                    onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <span>Crear Cuenta</span>}
          </button>
        </form>
      </div>
    </div>

  )
}
