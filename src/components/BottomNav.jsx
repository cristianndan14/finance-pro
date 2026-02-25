import { Home, PieChart, Plus, Target, Users } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function BottomNav() {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (path) => location.pathname === path

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40">
            <div className="max-w-md mx-auto flex justify-around items-center">
                <button
                    onClick={() => navigate('/')}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Home size={24} />
                    <span className="text-xs font-medium">Inicio</span>
                </button>

                <button
                    onClick={() => navigate('/budgets')}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/budgets')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <PieChart size={24} />
                    <span className="text-xs font-medium">Presupuestos</span>
                </button>

                <button
                    onClick={() => navigate('/transactions/new')}
                    className="flex flex-col items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                >
                    <Plus size={24} />
                    <span className="text-xs font-medium">Nuevo</span>
                </button>

                <button
                    onClick={() => navigate('/goals')}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/goals')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Target size={24} />
                    <span className="text-xs font-medium">Metas</span>
                </button>

                <button
                    onClick={() => navigate('/friends')}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${isActive('/friends')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Users size={24} />
                    <span className="text-xs font-medium">Social</span>
                </button>
            </div>
        </nav>
    )
}
