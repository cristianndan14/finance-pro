import { useNavigate } from 'react-router-dom'
import { TrendingUp, Clock, Tag, FileText } from 'lucide-react'

export default function QuickActions() {
    const navigate = useNavigate()

    const actions = [
        {
            label: 'Analíticas',
            icon: TrendingUp,
            path: '/analytics',
            color: 'text-green-700',
            bg: 'bg-green-50',
            hover: 'hover:bg-green-100'
        },
        {
            label: 'Pagos Recurrentes',
            icon: Clock,
            path: '/recurring',
            color: 'text-indigo-700',
            bg: 'bg-indigo-50',
            hover: 'hover:bg-indigo-100'
        },
        {
            label: 'Historial',
            icon: FileText,
            path: '/transactions',
            color: 'text-blue-700',
            bg: 'bg-blue-50',
            hover: 'hover:bg-blue-100'
        },
        {
            label: 'Categorías',
            icon: Tag,
            path: '/categories',
            color: 'text-purple-700',
            bg: 'bg-purple-50',
            hover: 'hover:bg-purple-100'
        }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {actions.map((action) => (
                <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 ${action.bg} ${action.hover} active:scale-95`}
                >
                    <div className={`p-2 rounded-full bg-white/50 mb-2 ${action.color}`}>
                        <action.icon size={24} />
                    </div>
                    <span className={`text-sm font-semibold ${action.color}`}>
                        {action.label}
                    </span>
                </button>
            ))}
        </div>
    )
}
