import { useState } from 'react'
import { useFriends } from '../hooks/useFriends'
import { Loader2, UserPlus, Users, Check, X, Mail, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function FriendsPage() {
    const navigate = useNavigate()
    const { friends, requests, pendingSent, loading, sendFriendRequest, respondToRequest } = useFriends()
    const [emailInput, setEmailInput] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('friends') // 'friends' | 'requests'

    const handleSendRequest = async (e) => {
        e.preventDefault()
        if (!emailInput) return

        setIsSubmitting(true)
        const result = await sendFriendRequest(emailInput)
        setIsSubmitting(false)

        if (result.success) {
            setEmailInput('')
            alert(result.message) // Simple alert for now, could be a toast
        } else {
            alert(result.message)
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
        <div className="p-4 pb-24 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                {/* Optional Back button if not main nav */}
                {/* <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </button> */}
                <h1 className="text-2xl font-bold text-gray-900">Social</h1>
            </div>

            {/* Add Friend Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserPlus size={18} className="text-blue-600" />
                    Agregar Amigo
                </h2>
                <form onSubmit={handleSendRequest} className="flex gap-2">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="email"
                            placeholder="Correo electrónico del usuario..."
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Enviar'}
                    </button>
                </form>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-4">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'friends' ? 'text-blue-600' : 'text-gray-500'}`}
                >
                    Mis Amigos ({friends.length})
                    {activeTab === 'friends' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${activeTab === 'requests' ? 'text-blue-600' : 'text-gray-500'}`}
                >
                    Solicitudes
                    {(requests.length > 0 || pendingSent.length > 0) && (
                        <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 rounded-full">{requests.length + pendingSent.length}</span>
                    )}
                    {activeTab === 'requests' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                </button>
            </div>

            {activeTab === 'friends' ? (
                <div className="space-y-3">
                    {friends.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-xl">
                            <Users className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-gray-500">Aún no tienes conexiones.</p>
                            <p className="text-xs text-gray-400">Invita a alguien por correo arriba.</p>
                        </div>
                    ) : (
                        friends.map(friend => (
                            <div key={friend.friendship_id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-600 font-bold uppercase">
                                        {friend.full_name?.[0] || friend.email[0]}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{friend.full_name || 'Usuario'}</p>
                                        <p className="text-xs text-gray-500">{friend.email}</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">
                                    Amigos
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Incoming Requests */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recibidas ({requests.length})</h3>
                        {requests.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No tienes solicitudes pendientes.</p>
                        ) : (
                            <div className="space-y-2">
                                {requests.map(req => (
                                    <div key={req.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold uppercase">
                                                {req.requester?.full_name?.[0] || req.requester?.email?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{req.requester?.full_name || req.requester?.email || 'Usuario Desconocido'}</p>
                                                <p className="text-xs text-gray-500">Quiere conectar contigo</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => respondToRequest(req.id, true)}
                                                className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => respondToRequest(req.id, false)}
                                                className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sent Requests */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Enviadas ({pendingSent.length})</h3>
                        {pendingSent.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No has enviado solicitudes recientes.</p>
                        ) : (
                            <div className="space-y-2">
                                {pendingSent.map(req => (
                                    <div key={req.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between opacity-75">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold uppercase">
                                                {req.addressee?.full_name?.[0] || req.addressee?.email?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-700">{req.addressee?.full_name || req.addressee?.email || 'Usuario Desconocido'}</p>
                                                <p className="text-xs text-gray-500">{req.addressee?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Clock size={14} />
                                            Pendiente
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
