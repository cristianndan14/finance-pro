import { useState } from 'react'
import { useBudgets } from '../hooks/useBudgets'
import { Plus, Loader2 } from 'lucide-react'
import BudgetCard from '../components/ui/BudgetCard'
import CreateBudgetForm from '../components/ui/CreateBudgetForm'

export default function BudgetsPage() {
    const { budgets, loading, createBudget } = useBudgets()
    const [showCreateForm, setShowCreateForm] = useState(false)

    const handleCreateBudget = async (budgetData) => {
        await createBudget(budgetData)
        setShowCreateForm(false)
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Presupuestos</h1>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                    <Plus size={18} />
                    Nuevo
                </button>
            </div>

            {budgets.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 mb-4">No tienes presupuestos creados</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Crear tu primer presupuesto
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {budgets.map((budget) => (
                        <BudgetCard key={budget.id} budget={budget} />
                    ))}
                </div>
            )}

            {showCreateForm && (
                <CreateBudgetForm
                    onSubmit={handleCreateBudget}
                    onCancel={() => setShowCreateForm(false)}
                />
            )}
        </div>
    )
}
