'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Download,
  Settings,
  Crown,
  Star,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { HockeyPaymentUtils } from '@/lib/stripe/client'
import type { SubscriptionInfo } from '@/lib/stripe/subscription-service'

interface SubscriptionDashboardProps {
  subscription: SubscriptionInfo | null
  billingHistory: any[]
  onUpgrade: () => void
  onCancel: () => void
  onReactivate: () => void
  isLoading?: boolean
}

export function SubscriptionDashboard({
  subscription,
  billingHistory,
  onUpgrade,
  onCancel,
  onReactivate,
  isLoading = false
}: SubscriptionDashboardProps) {
  const [timeToRenewal, setTimeToRenewal] = useState<string>('')

  useEffect(() => {
    if (!subscription?.currentPeriodEnd) return

    const updateCountdown = () => {
      const now = new Date()
      const renewal = new Date(subscription.currentPeriodEnd)
      const diff = renewal.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeToRenewal('Renewing...')
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      if (days > 0) {
        setTimeToRenewal(`${days} day${days > 1 ? 's' : ''}`)
      } else {
        setTimeToRenewal(`${hours} hour${hours > 1 ? 's' : ''}`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [subscription?.currentPeriodEnd])

  const isActive = subscription && HockeyPaymentUtils.isSubscriptionActive(subscription.status)
  const leadsRemaining = subscription ? 
    subscription.leadLimit === -1 ? 'Unlimited' : 
    Math.max(0, subscription.leadLimit - subscription.leadsUsedThisMonth) : 0

  const usagePercentage = subscription && subscription.leadLimit > 0 ? 
    (subscription.leadsUsedThisMonth / subscription.leadLimit) * 100 : 0

  if (!subscription) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Active Subscription
          </h3>
          <p className="text-gray-600 mb-6">
            Choose a plan to start receiving leads and grow your business
          </p>
          <Button onClick={onUpgrade} className="bg-blue-600 hover:bg-blue-700">
            View Plans
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {subscription.plan.id === 'featured' && <Crown className="h-5 w-5 text-amber-600" />}
              {subscription.plan.id === 'premium' && <Star className="h-5 w-5 text-purple-600" />}
              {subscription.plan.id === 'basic' && <Users className="h-5 w-5 text-gray-600" />}
              {subscription.plan.name} Plan
            </CardTitle>
            <Badge className={HockeyPaymentUtils.getSubscriptionStatusColor(subscription.status)}>
              {HockeyPaymentUtils.getSubscriptionStatusLabel(subscription.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ${subscription.plan.price}
              </div>
              <div className="text-sm text-gray-600">per month</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {typeof leadsRemaining === 'number' ? leadsRemaining : leadsRemaining}
              </div>
              <div className="text-sm text-gray-600">leads remaining</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {timeToRenewal}
              </div>
              <div className="text-sm text-gray-600">until renewal</div>
            </div>
          </div>

          {/* Usage Progress */}
          {subscription.leadLimit > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Lead Usage This Month</span>
                <span className="text-sm font-medium">
                  {subscription.leadsUsedThisMonth} / {subscription.leadLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    usagePercentage >= 90 ? "bg-red-500" :
                    usagePercentage >= 75 ? "bg-yellow-500" : 
                    "bg-green-500"
                  )}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              {usagePercentage >= 90 && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  You're approaching your lead limit. Consider upgrading your plan.
                </p>
              )}
            </div>
          )}

          {/* Renewal Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Next Billing Date</div>
                <div className="text-sm text-gray-600">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <div className="text-sm text-red-600 mt-1">
                    ⚠️ Subscription will cancel on this date
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ${subscription.plan.price}
                </div>
                <div className="text-sm text-gray-600">
                  {subscription.cancelAtPeriodEnd ? 'Final payment' : 'Auto-renew'}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {subscription.cancelAtPeriodEnd ? (
              <Button onClick={onReactivate} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                Reactivate Subscription
              </Button>
            ) : (
              <>
                <Button onClick={onUpgrade} variant="outline" disabled={isLoading}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Change Plan
                </Button>
                <Button 
                  onClick={onCancel} 
                  variant="outline" 
                  disabled={isLoading}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Cancel Subscription
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Plan Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscription.plan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <div className="text-center py-6">
              <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No billing history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billingHistory.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {invoice.description}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(invoice.created).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${(invoice.amount / 100).toFixed(2)}
                      </div>
                      <Badge 
                        variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    {invoice.invoicePdf && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {billingHistory.length > 5 && (
                <Button variant="outline" className="w-full">
                  View All Invoices
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}