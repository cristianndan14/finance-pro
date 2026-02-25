import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useFriends = () => {
    const { user } = useAuth()
    const [friends, setFriends] = useState([])
    const [requests, setRequests] = useState([]) // Incoming requests
    const [pendingSent, setPendingSent] = useState([]) // Outgoing requests
    const [loading, setLoading] = useState(true)

    const fetchFriendsAndRequests = async () => {
        if (!user) return
        setLoading(true)
        try {
            // 1. Fetch Friends (via View for simplicity, or simple join)
            // Using logic: status='accepted' implies friendship
            const { data: friendsData, error: friendsError } = await supabase
                .from('friendships')
                .select(`
                    id,
                    status,
                    requester:profiles!requester_id(id, full_name, email),
                    addressee:profiles!addressee_id(id, full_name, email)
                `)
                .eq('status', 'accepted')
                .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

            if (friendsError) throw friendsError

            // Map to a clean "Friend Profile" structure
            const formattedFriends = friendsData.map(f => {
                const friendProfile = f.requester.id === user.id ? f.addressee : f.requester
                return {
                    friendship_id: f.id,
                    ...friendProfile
                }
            })
            setFriends(formattedFriends)

            // 2. Fetch Incoming Requests (status='pending', addressee_id=me)
            const { data: incomingData, error: incomingError } = await supabase
                .from('friendships')
                .select(`
                    id,
                    created_at,
                    requester:profiles!requester_id(id, full_name, email)
                `)
                .eq('status', 'pending')
                .eq('addressee_id', user.id)

            if (incomingError) throw incomingError
            setRequests(incomingData)

            // 3. Fetch Sent Requests (status='pending', requester_id=me)
            const { data: sentData, error: sentError } = await supabase
                .from('friendships')
                .select(`
                 id,
                 created_at,
                 addressee:profiles!addressee_id(id, full_name, email)
             `)
                .eq('status', 'pending')
                .eq('requester_id', user.id)

            if (sentError) throw sentError
            setPendingSent(sentData)

        } catch (error) {
            console.error('Error fetching friends:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendFriendRequest = async (email) => {
        try {
            const { data, error } = await supabase.rpc('send_friend_request', { target_email: email })
            if (error) throw error
            if (!data.success) throw new Error(data.message)

            await fetchFriendsAndRequests()
            return { success: true, message: data.message }
        } catch (error) {
            return { success: false, message: error.message || 'Error al enviar solicitud' }
        }
    }

    const respondToRequest = async (friendshipId, accept) => {
        try {
            if (accept) {
                const { error } = await supabase
                    .from('friendships')
                    .update({ status: 'accepted' })
                    .eq('id', friendshipId)
                if (error) throw error
            } else {
                // Reject/Delete
                const { error } = await supabase
                    .from('friendships')
                    .delete()
                    .eq('id', friendshipId)
                if (error) throw error
            }
            await fetchFriendsAndRequests()
            return { success: true }
        } catch (error) {
            console.error('Error responding:', error)
            return { success: false, message: 'Error al procesar solicitud' }
        }
    }

    useEffect(() => {
        fetchFriendsAndRequests()

        // Setup realtime subscription
        const channel = supabase
            .channel('friendships-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'friendships' },
                () => fetchFriendsAndRequests()
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [user?.id])

    return {
        friends,
        requests,
        pendingSent,
        loading,
        sendFriendRequest,
        respondToRequest,
        refresh: fetchFriendsAndRequests
    }
}
