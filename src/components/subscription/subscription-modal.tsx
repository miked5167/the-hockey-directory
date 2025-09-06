'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  DollarSign,
  Crown,
  Star,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CheckoutForm } from './checkout-form'
import { PricingPlans } from './pricing-plans'
import { getAllPlans, getPlanById } from '@/lib/stripe/config'
import { HockeyPaymentUtils } from '@/lib/stripe/client'
import type { SubscriptionPlan } from '@/lib/stripe/config'
import type { SubscriptionInfo } from '@/lib/stripe/subscription-service'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  currentSubscription: SubscriptionInfo | null
  onSubscriptionUpdate: (subscription: SubscriptionInfo) => void
}

type ModalStep = 'select-plan' | 'confirm-change' | 'payment' | 'success' | 'cancel-confirm'

const planIcons = {
  basic: Users,
  premium: Star,
  featured: Crown
}

export function SubscriptionModal({
  isOpen,
  onClose,
  currentSubscription,
  onSubscriptionUpdate
}: SubscriptionModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('select-plan')
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [prorationInfo, setProrationInfo] = useState<any>(null)

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select-plan')
      setSelectedPlan(null)
      setError(null)
      setClientSecret(null)
      setProrationInfo(null)
    }
  }, [isOpen])

  const handlePlanSelect = async (planId: string) => {
    const plan = getPlanById(planId)
    if (!plan) return

    setSelectedPlan(plan)
    setError(null)

    // If user has current subscription, show confirmation
    if (currentSubscription) {
      calculateProration(plan)
      setCurrentStep('confirm-change')
    } else {
      // New subscription, go to payment
      await setupPayment(plan)
    }
  }

  const calculateProration = (newPlan: SubscriptionPlan) => {
    if (!currentSubscription) return

    const currentPlan = currentSubscription.plan
    const now = new Date()
    const periodEnd = new Date(currentSubscription.currentPeriodEnd)
    const totalDays = Math.floor(
      (periodEnd.getTime() - new Date(currentSubscription.currentPeriodStart).getTime()) / (1000 * 60 * 60 * 24)
    )
    const daysRemaining = Math.floor((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const proration = HockeyPaymentUtils.calculateProration(
      currentPlan.price,
      newPlan.price,
      daysRemaining,
      totalDays
    )

    setProrationInfo({
      ...proration,
      daysRemaining,
      isUpgrade: newPlan.price > currentPlan.price,
      isDowngrade: newPlan.price < currentPlan.price
    })
  }

  const setupPayment = async (plan: SubscriptionPlan) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscriptions/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId: plan.id })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to setup payment')
      }

      setClientSecret(result.setupIntent.client_secret)
      setCurrentStep('payment')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmChange = async () => {
    if (!selectedPlan) return
    await setupPayment(selectedPlan)
  }

  const handlePaymentSuccess = async (subscriptionId: string) => {
    setCurrentStep('success')
    
    // Refetch subscription data
    try {
      const response = await fetch('/api/subscriptions')
      const result = await response.json()
      
      if (result.subscription) {
        onSubscriptionUpdate(result.subscription)
      }
    } catch (error) {
      console.error('Failed to fetch updated subscription:', error)
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'DELETE'
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to cancel subscription')
      }

      const result = await response.json()
      onSubscriptionUpdate(result.subscription)
      setCurrentStep('success')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    switch (currentStep) {
      case 'select-plan':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentSubscription ? 'Change Your Plan' : 'Choose Your Plan'}
              </h3>
              <p className="text-gray-600 mt-1">
                {currentSubscription 
                  ? 'Select a new plan to upgrade or downgrade your subscription'
                  : 'Select the perfect plan for your hockey advisory business'
                }
              </p>
            </div>

            <PricingPlans
              currentPlan={currentSubscription?.plan.id}
              onSelectPlan={handlePlanSelect}
              isLoading={isLoading}
            />

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )

      case 'confirm-change':
        if (!selectedPlan || !currentSubscription || !prorationInfo) return null

        const CurrentIcon = planIcons[currentSubscription.plan.id as keyof typeof planIcons]
        const NewIcon = planIcons[selectedPlan.id as keyof typeof planIcons]

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Plan Change
              </h3>
              <p className="text-gray-600 mt-1">
                Review your plan change and billing details
              </p>
            </div>

            {/* Plan Change Visualization */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CurrentIcon className="h-8 w-8 text-gray-600" />
                    <div>
                      <div className="font-semibold">{currentSubscription.plan.name}</div>
                      <div className="text-sm text-gray-600">${currentSubscription.plan.price}/month</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {prorationInfo.isUpgrade ? (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-blue-600" />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <NewIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-semibold">{selectedPlan.name}</div>
                      <div className="text-sm text-gray-600">${selectedPlan.price}/month</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Details */}
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Billing change</span>
                  <span className="text-sm font-medium">
                    {prorationInfo.isUpgrade ? 'Immediate charge' : 'Next bill credit'}
                  </span>
                </div>
                
                {prorationInfo.immediateCharge > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Due today</span>
                    <span className="font-semibold text-green-600">
                      ${(prorationInfo.immediateCharge / 100).toFixed(2)}
                    </span>
                  </div>
                )}

                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Next billing amount</span>
                  <span className="font-semibold">${selectedPlan.price}/month</span>
                </div>

                <div className="text-xs text-gray-600">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Changes take effect immediately. Next bill on{' '}
                  {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('select-plan')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleConfirmChange}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Setting up...' : `Confirm ${prorationInfo.isUpgrade ? 'Upgrade' : 'Downgrade'}`}
              </Button>
            </div>
          </div>
        )

      case 'payment':
        if (!selectedPlan) return null

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Complete Your {currentSubscription ? 'Plan Change' : 'Subscription'}
              </h3>
              <p className="text-gray-600 mt-1">
                Secure payment powered by Stripe
              </p>
            </div>

            <CheckoutForm
              plan={selectedPlan}
              clientSecret={clientSecret || undefined}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              currentPlan={currentSubscription?.plan}
              prorationAmount={prorationInfo?.immediateCharge}
            />
          </div>
        )

      case 'success':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentSubscription ? 'Plan Updated Successfully!' : 'Welcome to The Hockey Directory!'}
              </h3>
              <p className="text-gray-600 mt-1">
                {selectedPlan 
                  ? `You're now on the ${selectedPlan.name} plan.`
                  : 'Your subscription has been updated.'
                }
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-900 font-medium">
                <DollarSign className="h-4 w-4" />
                What happens next?
              </div>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Your new features are active immediately</li>
                <li>• You'll receive a confirmation email with details</li>
                <li>• Access your dashboard to manage your subscription</li>
              </ul>
            </div>

            <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {currentStep === 'select-plan' && 'Subscription Plans'}
              {currentStep === 'confirm-change' && 'Confirm Changes'}
              {currentStep === 'payment' && 'Payment Details'}
              {currentStep === 'success' && 'Success!'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}