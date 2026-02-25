import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAccounts } from '../hooks/useAccounts'
import { useCategories } from '../hooks/useCategories'
import { ArrowLeft, Search, Filter, Loader2, Calendar, X } from 'lucide-react'

export default function TransactionsPage() {
    const navigate = useNavigate()
    const { accounts } = useAccounts()
    const { categories } = useCategories()

    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')

    // Filters
    const [filters, setFilters] = useState({
        accountId: '',
        categoryId: '',
        type: '',
        startDate: '',
        endDate: ''
    })

    const [showFilters, setShowFilters] = useState(false)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions()
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm, filters])

    const fetchTransactions = async () => {
        setLoading(true)
        setError(null)
        try {
            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    category:categories(name, color, icon),
                    account:accounts!account_id(name, currency),
                    budget:budgets(name)
                `)
                .order('created_at', { ascending: false })

            // Apply Filters
            if (searchTerm) {
                query = query.ilike('description', `%${searchTerm}%`)
            }
            if (filters.accountId) {
                query = query.or(`account_id.eq.${filters.accountId},transfer_target_id.eq.${filters.accountId}`)
            }
            if (filters.categoryId) {
                query = query.eq('category_id', filters.categoryId)
            }
            if (filters.type) {
                query = query.eq('type', filters.type)
            }
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate)
            }
            if (filters.endDate) {
                // Ensure end date covers the whole day
                query = query.lte('created_at', filters.endDate + 'T23:59:59')
            }

            const { data, error } = await query

            if (error) throw error
            setTransactions(data || [])
        } catch (err) {
            console.error('Error fetching transactions:', err)
            setError(err.message || 'Error al cargar transacciones')
        } finally {
            setLoading(false)
        }
    }

    const clearFilters = () => {
        setFilters({
            accountId: '',
            categoryId: '',
            type: '',
            startDate: '',
            endDate: ''
        })
        setSearchTerm('')
    }

    const activeFiltersCount = Object.values(filters).filter(Boolean).length

    return (
        <div className="p-4 pb-20 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Historial</h1>
            </div>

            {/* Search & Filter Toggle */}
            <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar transacciones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-xl border flex items-center gap-2 transition-colors ${showFilters || activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                    <Filter size={18} />
                    {activeFiltersCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-gray-900">Filtros</h3>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className="text-xs text-red-600 font-medium hover:underline">
                                Limpiar todo
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Cuenta</label>
                            <select
                                value={filters.accountId}
                                onChange={e => setFilters({ ...filters, accountId: e.target.value })}
                                className="w-full text-sm p-2 rounded-lg border border-gray-300"
                            >
                                <option value="">Todas</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Categoría</label>
                            <select
                                value={filters.categoryId}
                                onChange={e => setFilters({ ...filters, categoryId: e.target.value })}
                                className="w-full text-sm p-2 rounded-lg border border-gray-300"
                            >
                                <option value="">Todas</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo</label>
                            <select
                                value={filters.type}
                                onChange={e => setFilters({ ...filters, type: e.target.value })}
                                className="w-full text-sm p-2 rounded-lg border border-gray-300"
                            >
                                <option value="">Todos</option>
                                <option value="ingreso">Ingreso</option>
                                <option value="egreso">Egreso</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                        <label className="text-xs font-medium text-gray-500 mb-1 block flex items-center gap-1">
                            <Calendar size={12} /> Rango de Fechas
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full text-sm p-2 rounded-lg border border-gray-300"
                            />
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full text-sm p-2 rounded-lg border border-gray-300"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction List */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-blue-600" />
                </div>
            ) : error ? (
                <div className="text-center py-12 bg-red-50 rounded-2xl border-2 border-dashed border-red-200">
                    <p className="text-red-600 font-medium">Error al cargar transacciones</p>
                    <p className="text-red-400 text-sm mt-1">{error}</p>
                    <button onClick={fetchTransactions} className="text-blue-600 text-sm font-medium mt-3 hover:underline">
                        Reintentar
                    </button>
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500">No se encontraron transacciones</p>
                    {(searchTerm || activeFiltersCount > 0) && (
                        <button onClick={clearFilters} className="text-blue-600 text-sm font-medium mt-2 hover:underline">
                            Limpiar búsqueda
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((t) => {
                        const isTransfer = t.is_transfer
                        const isPositive = !isTransfer && t.type === 'ingreso'
                        // Complex display logic for transfers? Just showing 'Transfer' is fine for global list.

                        return (
                            <div key={t.id} onClick={() => navigate(`/transactions/${t.id}`)} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center transition-all hover:shadow-md cursor-pointer active:scale-[0.99]">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isPositive ? 'bg-green-100 text-green-600' : isTransfer ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                        {isTransfer ? '⇄' : (isPositive ? '↓' : '↑')}
                                    </div>
                                    <div>
                                        {(() => {
                                            let cleanDesc = t.description?.replace(/\s\(Cuota\s\d+\/\d+\)$/, '') || '';
                                            if (cleanDesc === 'Compra en cuotas') cleanDesc = '';

                                            const categoryName = t.category?.name;
                                            const installmentInfo = t.installments_count > 1 ? ` (${t.installment_number}/${t.installments_count})` : '';

                                            let label = '';
                                            if (isTransfer) {
                                                const targetAcc = accounts.find(a => a.id === t.transfer_target_id);
                                                if (targetAcc?.type === 'credit') {
                                                    const txDate = new Date(t.created_at);
                                                    label = txDate.getDate() <= (targetAcc.closing_day || 31)
                                                        ? 'Adelanto de pago'
                                                        : 'Pago de tarjeta';
                                                } else {
                                                    label = 'Transferencia';
                                                }
                                            } else {
                                                if (cleanDesc && categoryName) {
                                                    label = `${cleanDesc} • ${categoryName}`;
                                                } else {
                                                    label = cleanDesc || categoryName || 'Varios';
                                                }
                                                label += installmentInfo;
                                            }

                                            return <p className="font-medium text-gray-900">{label}</p>;
                                        })()}
                                        <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                                            <span>{new Date(t.created_at).toLocaleDateString('es-AR')}</span>
                                            <span>•</span>
                                            <span>{t.account?.name}</span>
                                            {t.budget && (
                                                <>
                                                    <span>•</span>
                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{t.budget.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${isPositive ? 'text-green-600' : isTransfer ? 'text-gray-900' : 'text-red-600'}`}>
                                        {isPositive ? '+' : isTransfer ? '' : '-'}
                                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: t.currency || 'ARS' }).format(t.amount)}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
