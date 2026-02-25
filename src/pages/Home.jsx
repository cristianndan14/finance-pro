import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAccounts } from '../hooks/useAccounts'
import { supabase } from '../lib/supabaseClient'
import { LogOut, Plus, Loader2, Edit2, Trash2, Download } from 'lucide-react'
import AccountCard from '../components/ui/AccountCard'
import CreateAccountForm from '../components/ui/CreateAccountForm'
import QuickActions from '../components/dashboard/QuickActions'
import CurrencySummary from '../components/ui/CurrencySummary'

export default function Home() {
    const { user, signOut } = useAuth()
    const { accounts, loading, addAccount, updateAccount, deleteAccount } = useAccounts()

    // Show all accounts (goals no longer create dedicated accounts)
    const visibleAccounts = accounts

    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editingAccount, setEditingAccount] = useState(null)
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
        if (window.confirm('¿Estás seguro de eliminar esta cuenta?')) {
            await deleteAccount(accountId)
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

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

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
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Mis Cuentas</h2>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                    >
                        <Plus size={18} />
                        Agregar
                    </button>
                </div>

                {visibleAccounts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 mb-4">No tienes cuentas registradas</p>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Crear tu primera cuenta
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visibleAccounts.map((account) => (
                            <div key={account.id} className="relative group">
                                <AccountCard account={account} />
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingAccount(account)}
                                        className="p-2 bg-white rounded-full shadow-md hover:bg-blue-50 text-blue-600 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAccount(account.id)}
                                        className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-red-600 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
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
        </div>
    )
}
