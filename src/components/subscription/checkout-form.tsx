'use client'

import { useState, useEffect } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Shield, Check, AlertCircle } from 'lucide-react'
import { getStripe, HockeyPaymentUtils } from '@/lib/stripe/client'
import { cn } from '@/lib/utils'
import type { SubscriptionPlan } from '@/lib/stripe/config'

interface CheckoutFormProps {
  plan: SubscriptionPlan
  clientSecret?: string
  onSuccess: (subscriptionId: string) => void
  onError: (error: string) => void
  currentPlan?: SubscriptionPlan | null
  prorationAmount?: number
}

function PaymentForm({ 
  plan, 
  onSuccess, 
  onError, 
  currentPlan, 
  prorationAmount 
}: Omit<CheckoutFormProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const isUpgrade = currentPlan && plan.price > currentPlan.price
  const isDowngrade = currentPlan && plan.price < currentPlan.price
  const immediateCharge = prorationAmount && prorationAmount > 0 ? prorationAmount : 0

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentError(null)

    try {
      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          billing_details: {
            // Will be collected by Stripe Elements
          }
        }
      })

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message)
      }

      // Call our API to create/update subscription
      const response = await fetch('/api/subscriptions', {
        method: currentPlan ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethodId: paymentMethod.id
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process subscription')
      }

      // Success!
      onSuccess(result.subscription.stripeSubscriptionId)
    } catch (error: any) {
      console.error('Payment failed:', error)
      setPaymentError(error.message || 'Payment failed. Please try again.')
      onError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method
        </label>
        <div className="border border-gray-200 rounded-lg p-4">
          <PaymentElement 
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card']
            }}
          />
        </div>
      </div>

      {/* Billing Summary */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Billing Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>{plan.name} Plan</span>
            <span className="font-semibold">${plan.price}/month</span>
          </div>

          {immediateCharge > 0 && (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Prorated charge</span>
                <span>${(immediateCharge / 100).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Due today</span>
                <span>${(immediateCharge / 100).toFixed(2)}</span>
              </div>
            </>
          )}

          <div className="text-sm text-gray-600">
            {isUpgrade && 'You will be charged prorated amount for the upgrade.'}
            {isDowngrade && 'Your next bill will be reduced to reflect the downgrade.'}
            {!currentPlan && 'Billing starts immediately. Cancel anytime.'}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {paymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {currentPlan 
              ? `${isUpgrade ? 'Upgrade' : 'Downgrade'} to ${plan.name}`
              : `Subscribe to ${plan.name}`
            }
          </div>
        )}
      </Button>

      {/* Trust Signals */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Secure payment
        </div>
        <div className="flex items-center gap-1">
          <Check className="h-3 w-3" />
          Cancel anytime
        </div>
        <div className="flex items-center gap-1">
          <Check className="h-3 w-3" />
          30-day guarantee
        </div>
      </div>
    </form>
  )
}

export function CheckoutForm({
  plan,
  clientSecret,
  onSuccess,
  onError,
  currentPlan,
  prorationAmount
}: CheckoutFormProps) {
  const [stripePromise] = useState(() => getStripe())

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#374151',
      colorDanger: '#dc2626',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px'
    }
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance
      }}
    >
      <PaymentForm
        plan={plan}
        onSuccess={onSuccess}
        onError={onError}
        currentPlan={currentPlan}
        prorationAmount={prorationAmount}
      />
    </Elements>
  )
}