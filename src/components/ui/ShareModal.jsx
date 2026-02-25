import { useState } from 'react'
import { X, UserPlus, Loader2, Users, Check } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useFriends } from '../../hooks/useFriends'

export default function ShareModal({ isOpen, onClose, resourceType, resourceId, resourceName, onMemberAdded }) {
    const { friends } = useFriends()
    const [loading, setLoading] = useState(false)
    const [selectedFriendId, setSelectedFriendId] = useState('')
    const [role, setRole] = useState('viewer')
    const [emailInput, setEmailInput] = useState('') // Fallback for non-friends

    if (!isOpen) return null

    const handleShare = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            let targetEmail = emailInput
            if (selectedFriendId) {
                const friend = friends.find(f => f.friendship_id === selectedFriendId || f.id === selectedFriendId) // Adjust based on hook return
                if (friend) targetEmail = friend.email
            }

            if (!targetEmail) {
                alert('Selecciona un amigo o ingresa un correo')
                setLoading(false)
                return
            }

            // Call RPC
            const { data, error } = await supabase.rpc('add_member_by_email', {
                resource_type: resourceType,
                resource_id: resourceId,
                target_email: targetEmail,
                target_role: role
            })

            if (error) throw error

            if (data.success) {
                alert('¡Usuario agregado exitosamente!')
                if (onMemberAdded) onMemberAdded()
                onClose()
            } else {
                alert('Error: ' + data.message)
            }

        } catch (error) {
            console.error('Error sharing:', error)
            alert('Error al compartir el recurso')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-blue-600" size={20} />
                        Compartir "{resourceName}"
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleShare} className="p-4 space-y-4">
                    {/* Option A: Select Friend */}
                    {friends.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Seleccionar Amigo
                            </label>
                            <select
                                value={selectedFriendId}
                                onChange={(e) => {
                                    setSelectedFriendId(e.target.value)
                                    setEmailInput('') // Clear manual input
                                }}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Elige un amigo --</option>
                                {friends.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.full_name} ({f.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Option B: Enter Email */}
                    {!selectedFriendId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                O invitar por correo
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required={!selectedFriendId}
                                />
                            </div>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Permisos
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setRole('viewer')}
                                className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${role === 'viewer' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Users size={16} />
                                Ver (Solo lectura)
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('editor')}
                                className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${role === 'editor' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <UserPlus size={16} />
                                Editar (Agregar gastos)
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || (!selectedFriendId && !emailInput)}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    <UserPlus size={20} />
                                    Enviar Invitación
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
