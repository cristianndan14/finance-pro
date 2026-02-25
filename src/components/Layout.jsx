import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import BottomNav from './BottomNav'
import { useRecurringTransactions } from '../hooks/useRecurringTransactions'

export default function Layout() {
    const { processDueTransactions } = useRecurringTransactions()

    useEffect(() => {
        // Check for due transactions every time the app opens/refreshes
        processDueTransactions()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-md mx-auto min-h-screen bg-white shadow-lg">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    )
}
