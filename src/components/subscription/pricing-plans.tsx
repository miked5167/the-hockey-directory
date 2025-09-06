'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Check, Star, Crown, Zap, Users, BarChart3, Calendar, Shield, Headphones, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUBSCRIPTION_PLANS, getAllPlans } from '@/lib/stripe/config'
import type { SubscriptionPlan } from '@/lib/stripe/config'

interface PricingPlansProps {
  currentPlan?: string
  onSelectPlan: (planId: string) => void
  isLoading?: boolean
  className?: string
}

const planIcons = {
  basic: Users,
  premium: Star,
  featured: Crown
}

const planColors = {
  basic: 'border-gray-200 bg-white',
  premium: 'border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50',
  featured: 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
}

const planButtonColors = {
  basic: 'bg-gray-900 hover:bg-gray-800 text-white',
  premium: 'bg-purple-600 hover:bg-purple-700 text-white',
  featured: 'bg-amber-600 hover:bg-amber-700 text-white'
}

export function PricingPlans({ currentPlan, onSelectPlan, isLoading, className }: PricingPlansProps) {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annually'>('monthly')
  const plans = getAllPlans()

  const getDiscountedPrice = (plan: SubscriptionPlan) => {
    if (billingInterval === 'annually') {
      return Math.round(plan.price * 12 * 0.85) // 15% annual discount
    }
    return plan.price
  }

  const getSavingsAmount = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.price * 12
    const annualPrice = getDiscountedPrice(plan)
    return monthlyTotal - annualPrice
  }

  return (
    <div className={cn("max-w-7xl mx-auto", className)}>
      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              billingInterval === 'monthly'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annually')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors relative",
              billingInterval === 'annually'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            Annual
            <Badge className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs px-2 py-1">
              Save 15%
            </Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
        {plans.map((plan) => {
          const Icon = planIcons[plan.id as keyof typeof planIcons]
          const isCurrentPlan = currentPlan === plan.id
          const discountedPrice = getDiscountedPrice(plan)
          const savings = getSavingsAmount(plan)
          
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative transition-all duration-200 hover:shadow-lg",
                planColors[plan.id as keyof typeof planColors],
                isCurrentPlan && "ring-2 ring-blue-500",
                plan.popular && "scale-105 shadow-xl"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className={cn(
                    "p-3 rounded-full",
                    plan.id === 'basic' && "bg-gray-100",
                    plan.id === 'premium' && "bg-purple-100",
                    plan.id === 'featured' && "bg-amber-100"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6",
                      plan.id === 'basic' && "text-gray-600",
                      plan.id === 'premium' && "text-purple-600",
                      plan.id === 'featured' && "text-amber-600"
                    )} />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 mt-2">{plan.description}</p>

                {/* Pricing */}
                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      ${billingInterval === 'monthly' ? plan.price : Math.round(discountedPrice / 12)}
                    </span>
                    <span className="text-gray-500 ml-2">
                      /month{billingInterval === 'annually' && ', billed annually'}
                    </span>
                  </div>
                  
                  {billingInterval === 'annually' && (
                    <div className="mt-2">
                      <span className="text-green-600 font-medium text-sm">
                        Save ${savings} per year
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Key Metrics */}
                <div className="bg-white/80 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Monthly Leads:</span>
                    <span className="font-semibold text-gray-900">
                      {plan.leadLimit === -1 ? 'Unlimited' : plan.leadLimit}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Search Priority:</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: plan.priority }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>

                  {plan.profileBoost && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <BarChart3 className="h-4 w-4" />
                      Enhanced Profile Visibility
                    </div>
                  )}

                  {plan.featuredPlacement && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <Crown className="h-4 w-4" />
                      Featured Placement
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={isLoading || isCurrentPlan}
                  className={cn(
                    "w-full h-12 text-base font-semibold",
                    planButtonColors[plan.id as keyof typeof planButtonColors],
                    isCurrentPlan && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isCurrentPlan ? 'Current Plan' : 
                   isLoading ? 'Processing...' : 
                   `Choose ${plan.name}`}
                </Button>

                {/* Support Level */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Headphones className="h-4 w-4" />
                    {plan.id === 'basic' && 'Email Support'}
                    {plan.id === 'premium' && 'Priority Support'}
                    {plan.id === 'featured' && 'Concierge Support'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Trust Signals */}
      <div className="mt-12 text-center">
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            30-day money back guarantee
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Cancel anytime
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Instant activation
          </div>
        </div>
      </div>
    </div>
  )
}