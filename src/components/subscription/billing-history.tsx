'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Receipt, 
  CreditCard, 
  Calendar,
  Search,
  Filter,
  ExternalLink,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HockeyPaymentUtils } from '@/lib/stripe/client'

interface Invoice {
  id: string
  amount: number
  currency: string
  status: string
  created: Date
  paidAt: Date | null
  hostedInvoiceUrl?: string
  invoicePdf?: string
  description: string
}

interface BillingHistoryProps {
  invoices: Invoice[]
  isLoading?: boolean
  onRefresh?: () => void
  className?: string
}

export function BillingHistory({ 
  invoices, 
  isLoading = false, 
  onRefresh,
  className 
}: BillingHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'all' | '30' | '90' | '365'>('all')

  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

    const matchesDate = (() => {
      if (dateRange === 'all') return true
      const days = parseInt(dateRange)
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      return invoice.created >= cutoff
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'void':
      case 'uncollectible':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'open':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'void':
      case 'uncollectible':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const totalAmount = filteredInvoices.reduce((sum, invoice) => 
    invoice.status === 'paid' ? sum + invoice.amount : sum, 0
  )

  const uniqueStatuses = Array.from(new Set(invoices.map(i => i.status)))

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {filteredInvoices.length}
            </div>
            <div className="text-sm text-gray-600">Total Invoices</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${(totalAmount / 100).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Paid</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {invoices.filter(i => i.status === 'paid').length}
            </div>
            <div className="text-sm text-gray-600">Successful Payments</div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' || dateRange !== 'all' 
                ? 'No invoices match your filters'
                : 'No billing history yet'
              }
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Your invoices will appear here once you have an active subscription'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status)}
                        <Badge className={cn('text-xs', getStatusColor(invoice.status))}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {invoice.created.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>

                    <div className="font-medium text-gray-900 mb-1">
                      {invoice.description}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Invoice #{invoice.id.slice(-8).toUpperCase()}
                      {invoice.paidAt && (
                        <span className="ml-2">
                          • Paid on {invoice.paidAt.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {HockeyPaymentUtils.formatCurrency(invoice.amount, invoice.currency)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {invoice.hostedInvoiceUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          asChild
                        >
                          <a
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        </Button>
                      )}

                      {invoice.invoicePdf && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          asChild
                        >
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination or Load More (future enhancement) */}
        {filteredInvoices.length > 0 && invoices.length > filteredInvoices.length && (
          <div className="text-center">
            <Button variant="outline" size="sm">
              Load More Invoices
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}