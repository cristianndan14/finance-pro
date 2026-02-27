import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccounts } from '../hooks/useAccounts'
import { useEntities } from '../hooks/useEntities'
import { supabase } from '../lib/supabaseClient'
import { LogOut, Plus, Loader2, Edit2, Trash2, Download, Building, FolderPlus } from 'lucide-react'
import AccountCard from '../components/ui/AccountCard'
import CreateAccountForm from '../components/ui/CreateAccountForm'
import CreateEntityModal from '../components/ui/CreateEntityModal'
import QuickActions from '../components/dashboard/QuickActions'
import CurrencySummary from '../components/ui/CurrencySummary'

export default function Home() {
    const { user, signOut } = useAuth()
    const { accounts, loading: accountsLoading, addAccount, updateAccount, deleteAccount } = useAccounts()
    const { entities, loading: entitiesLoading, updateEntity, deleteEntity } = useEntities()

    // Show all accounts
    const visibleAccounts = accounts

    const [showCreateForm, setShowCreateForm] = useState(false)
    const [showCreateEntity, setShowCreateEntity] = useState(false)
    const [editingAccount, setEditingAccount] = useState(null)
    const [editingEntity, setEditingEntity] = useState(null)
    const [searchParams] = useSearchParams()
    const [exporting, setExporting] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (searchParams.get('action') === 'create-account') {
            setShowCreateForm(true)
        }
    }, [searchParams])


    const handleCreateAccount = async (accountData) => {
        await addAccount(accountData)
        setShowCreateForm(false)
    }

    const handleUpdateAccount = async (accountData) => {
        await updateAccount(editingAccount.id, accountData)
        setEditingAccount(null)
    }

    const handleDeleteAccount = async (accountId) => {
        if (window.confirm('¿Estás seguro de eliminar este producto?')) {
            await deleteAccount(accountId)
        }
    }

    const handleDeleteEntity = async (entityId) => {
        if (window.confirm('¿Estás seguro de eliminar esta entidad? Los productos asociados quedarán sin asignar.')) {
            await deleteEntity(entityId)
        }
    }

    const handleExport = async () => {
        if (!confirm('¿Descargar todas tus transacciones en CSV?')) return
        setExporting(true)
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    date:created_at,
                    amount,
                    type,
                    description,
                    category:categories(name),
                    account:accounts!account_id(name, currency),
                    budget:budgets(name)
                `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            if (!data || data.length === 0) {
                alert('No hay transacciones para exportar')
                return
            }

            // Convert to CSV
            const headers = ['Fecha', 'Tipo', 'Monto', 'Moneda', 'Cuenta', 'Categoría', 'Presupuesto', 'Descripción']
            const csvRows = [headers.join(',')]

            for (const row of data) {
                const values = [
                    new Date(row.date).toLocaleDateString(),
                    row.type,
                    row.amount,
                    row.account?.currency || 'ARS',
                    `"${row.account?.name || ''}"`,
                    `"${row.category?.name || ''}"`,
                    `"${row.budget?.name || ''}"`,
                    `"${row.description || ''}"`
                ]
                csvRows.push(values.join(','))
            }

            const csvContent = csvRows.join('\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `finance_pro_export_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

        } catch (error) {
            console.error('Error exporting:', error)
            alert('Error al exportar datos')
        } finally {
            setExporting(false)
        }
    }

    if (accountsLoading || entitiesLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const unassignedAccounts = visibleAccounts.filter(acc => !acc.entity_id)

    return (
        <div className="p-4 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-blue-600">FinancePro</h1>
                    <p className="text-sm text-gray-600">Hola, {user?.user_metadata?.full_name?.split(' ')[0]}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Exportar CSV"
                    >
                        {exporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                    </button>
                    <button
                        onClick={signOut}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <QuickActions />

            {/* Net Worth Card */}
            <CurrencySummary accounts={accounts} />

            {/* Accounts Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Mis Productos Financieros</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCreateEntity(true)}
                            className="flex items-center justify-center p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Nueva Entidad"
                        >
                            <Building size={18} />
                        </button>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Plus size={18} />
                            Producto
                        </button>
                    </div>
                </div>

                {visibleAccounts.length === 0 && entities.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 mb-4">No tienes entidades ni productos registrados</p>
                        <button
                            onClick={() => setShowCreateEntity(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mb-2"
                        >
                            Crear tu primera entidad
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {entities.map(entity => {
                            const entityAccounts = visibleAccounts.filter(acc => acc.entity_id === entity.id)
                            return (
                                <div key={entity.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center group">
                                        <div className="flex items-center gap-2 text-gray-800 font-semibold">
                                            <Building size={18} className="text-blue-600" />
                                            {entity.name}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    const newName = window.prompt("Nuevo nombre para la entidad:", entity.name)
                                                    if (newName && newName.trim() !== "") {
                                                        updateEntity(entity.id, { name: newName.trim() })
                                                    }
                                                }}
                                                className="p-1.5 bg-white rounded-full shadow-sm hover:bg-blue-50 text-blue-600"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEntity(entity.id)}
                                                className="p-1.5 bg-white rounded-full shadow-sm hover:bg-red-50 text-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {entityAccounts.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic p-2 text-center">Sin productos asignados</p>
                                        ) : (
                                            entityAccounts.map((account) => (
                                                <div key={account.id} className="relative group">
                                                    <AccountCard account={account} />
                                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingAccount(account); }}
                                                            className="p-2 bg-white rounded-full shadow-md hover:bg-blue-50 text-blue-600 transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }}
                                                            className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-red-600 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {unassignedAccounts.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center gap-2 text-orange-800 font-semibold">
                                    <FolderPlus size={18} />
                                    Productos Sin Asignar
                                </div>
                                <div className="p-3 space-y-2">
                                    {unassignedAccounts.map((account) => (
                                        <div key={account.id} className="relative group">
                                            <AccountCard account={account} />
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingAccount(account); }}
                                                    className="p-2 bg-white rounded-full shadow-md hover:bg-blue-50 text-blue-600 transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }}
                                                    className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Account Modal */}
            {(showCreateForm || editingAccount) && (
                <CreateAccountForm
                    initialData={editingAccount}
                    onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
                    onCancel={() => {
                        setShowCreateForm(false)
                        setEditingAccount(null)
                    }}
                />
            )}

            {/* Create Entity Modal */}
            {showCreateEntity && (
                <CreateEntityModal
                    onClose={() => setShowCreateEntity(false)}
                />
            )}
        </div>
    )
}
