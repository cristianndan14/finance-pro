import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import AccountDetailPage from './pages/AccountDetailPage'
import LoginPage from './pages/Login'
import BudgetsPage from './pages/BudgetsPage'
import BudgetDetailPage from './pages/BudgetDetailPage'
import NewTransactionPage from './pages/NewTransactionPage'
import RecurringPage from './pages/RecurringPage'
import CategoriesPage from './pages/CategoriesPage'
import GoalsPage from './pages/GoalsPage'
import GoalDetailPage from './pages/GoalDetailPage'
import AnalyticsPage from './pages/AnalyticsPage'
import FriendsPage from './pages/FriendsPage'
import TransactionsPage from './pages/TransactionsPage'
import TransactionDetailPage from './pages/TransactionDetailPage'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/accounts/:id" element={<AccountDetailPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/budgets/:id" element={<BudgetDetailPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/goals/:id" element={<GoalDetailPage />} />
              <Route path="/transactions/:id" element={<TransactionDetailPage />} />
              <Route path="/transactions/new" element={<NewTransactionPage />} />
              <Route path="/recurring" element={<RecurringPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/friends" element={<FriendsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
