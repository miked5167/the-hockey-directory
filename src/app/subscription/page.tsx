'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react'
import { SubscriptionDashboard } from '@/components/subscription/subscription-dashboard'
import { SubscriptionModal } from '@/components/subscription/subscription-modal'
import { PricingPlans } from '@/components/subscription/pricing-plans'
import { ErrorBoundary } from '@/components/error-boundary'
import { useAnalytics, HockeyDirectoryEvents } from '@/lib/analytics'
import type { SubscriptionInfo } from '@/lib/stripe/subscription-service'

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { track } = useAnalytics()

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/subscription')
    }
  }, [status, router])

  // Fetch subscription data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubscriptionData()
      track(HockeyDirectoryEvents.DIRECTORY_LOADED, { page: 'subscription' })
    }
  }, [status, track])

  const fetchSubscriptionData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch subscription
      const subscriptionResponse = await fetch('/api/subscriptions')
      if (!subscriptionResponse.ok) {
        throw new Error('Failed to fetch subscription')
      }
      const subscriptionData = await subscriptionResponse.json()
      setSubscription(subscriptionData.subscription)

      // Fetch billing history if subscription exists
      if (subscriptionData.subscription) {
        const billingResponse = await fetch('/api/subscriptions/billing')
        if (billingResponse.ok) {
          const billingData = await billingResponse.json()
          setBillingHistory(billingData.invoices || [])
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch subscription data:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = () => {
    setIsSubscriptionModalOpen(true)
    track(HockeyDirectoryEvents.PREMIUM_ADVISOR_VIEWED, { 
      action: 'subscription_upgrade_clicked' 
    })
  }

  const handleCancel = async () => {
    if (!subscription) return

    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? Your subscription will remain active until the end of your current billing period.'
    )

    if (!confirmed) return

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to cancel subscription')
      }

      const result = await response.json()
      setSubscription(result.subscription)
      
      track(HockeyDirectoryEvents.ERROR_OCCURRED, { 
        action: 'subscription_canceled',
        plan: subscription.plan.id 
      })
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleReactivate = async () => {
    if (!subscription) return

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'reactivate'
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to reactivate subscription')
      }

      const result = await response.json()
      setSubscription(result.subscription)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleSubscriptionUpdate = (updatedSubscription: SubscriptionInfo) => {
    setSubscription(updatedSubscription)
    setIsSubscriptionModalOpen(false)
    
    // Refresh billing history
    fetchSubscriptionData()
  }

  const handlePlanSelect = (planId: string) => {
    setIsSubscriptionModalOpen(true)
    track(HockeyDirectoryEvents.PREMIUM_ADVISOR_VIEWED, { 
      action: 'plan_selected',
      plan: planId 
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
                <p className="text-gray-600 mt-2">
                  Manage your hockey directory subscription and billing
                </p>
              </div>
              
              {subscription && (
                <Button
                  onClick={handleUpgrade}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <TrendingUp className="h-4 w-4" />
                  Change Plan
                </Button>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Content */}
          {subscription ? (
            // Existing subscription dashboard
            <SubscriptionDashboard
              subscription={subscription}
              billingHistory={billingHistory}
              onUpgrade={handleUpgrade}
              onCancel={handleCancel}
              onReactivate={handleReactivate}
              isLoading={isLoading}
            />
          ) : (
            // No subscription - show pricing plans
            <div className="space-y-8">
              <Card>
                <CardContent className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Choose Your Plan
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                    Start growing your hockey advisory business with professional tools, 
                    lead generation, and premium placement in our directory.
                  </p>
                </CardContent>
              </Card>

              <PricingPlans
                onSelectPlan={handlePlanSelect}
                isLoading={isLoading}
              />

              {/* Value Propositions */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Grow Your Business</h3>
                    <p className="text-sm text-gray-600">
                      Get connected with qualified parents looking for hockey development guidance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Professional Tools</h3>
                    <p className="text-sm text-gray-600">
                      Advanced analytics, lead management, and professional profile features
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Cancel Anytime</h3>
                    <p className="text-sm text-gray-600">
                      No long-term contracts. Cancel or change your plan whenever you need to
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Subscription Modal */}
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            currentSubscription={subscription}
            onSubscriptionUpdate={handleSubscriptionUpdate}
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}