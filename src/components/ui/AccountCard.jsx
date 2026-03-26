import { Building2, Wallet, Banknote, Bitcoin, Package, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function AccountCard({ account }) {
  const navigate = useNavigate()

  const getAccountIcon = (type) => {
    switch (type) {
      case 'bank':
        return <Building2 size={24} />
      case 'wallet':
        return <Wallet size={24} />
      case 'cash':
        return <Banknote size={24} />
      case 'crypto':
        return <Bitcoin size={24} />
      case 'credit':
        return <CreditCard size={24} />
      default:
        return <Package size={24} />
    }
  }

  const getAccountColor = (type) => {
    switch (type) {
      case 'bank':
        return 'bg-blue-100 text-blue-600'
      case 'wallet':
        return 'bg-purple-100 text-purple-600'
      case 'cash':
        return 'bg-green-100 text-green-600'
      case 'crypto':
        return 'bg-orange-100 text-orange-600'
      case 'credit':
        return 'bg-rose-100 text-rose-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const colorClass = getAccountColor(account.type)

  return (
    <div
      onClick={() => navigate(`/accounts/${account.id}`)}
      className={cn(
        "p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md active:scale-95 cursor-pointer"
      )}
    >
      <div className={cn("p-3 rounded-xl", colorClass)}>
        {getAccountIcon(account.type)}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 capitalize">{account.name}</p>
        <div className="flex flex-col gap-1 mt-1">
          <p className={cn("text-lg font-bold leading-none",
            account.type === 'credit'
              ? "text-gray-900"
              : (account.current_balance < 0 ? "text-red-600" : "text-gray-900")
          )}>
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: account.type === 'credit' ? 'ARS' : (account.currency || 'ARS'),
            }).format(
              account.type === 'credit'
                ? (Number(account.credit_limit || 0) + Number(account.current_balance || 0))
                : account.current_balance
            )}
            {account.type === 'credit' && <span className="text-[10px] text-gray-400 font-normal ml-1">ARS</span>}
          </p>
          {account.type === 'credit' && (Number(account.credit_limit_usd) > 0 || Number(account.current_balance_usd) < 0) && (
              <p className="text-sm font-bold text-gray-700 leading-none">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(
                  account.credit_limit_usd ? (Number(account.credit_limit_usd || 0) + Number(account.current_balance_usd || 0)) : (Number(account.current_balance_usd || 0))
                )}
                <span className="text-[10px] text-gray-400 font-normal ml-1">USD</span>
              </p>
          )}
        </div>
      </div>
    </div>
  )
}
