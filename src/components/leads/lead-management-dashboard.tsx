'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageCircle,
  TrendingUp,
  Clock,
  User,
  Star,
  MoreHorizontal,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeadAnalytics } from './lead-analytics'

interface Lead {
  id: string
  parentName: string
  parentEmail: string
  parentPhone?: string
  playerName?: string
  playerAge?: number
  location?: string
  message: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
  source: string
  createdAt: string
  updatedAt: string
  conversionDate?: string
  notes?: string
}

interface LeadManagementDashboardProps {
  advisorId: string
  className?: string
}

const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800', icon: Star },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800', icon: MessageCircle },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800', icon: TrendingUp },
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle }
]

export function LeadManagementDashboard({ advisorId, className }: LeadManagementDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const fetchLeads = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/leads?advisorId=${advisorId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }
      
      const result = await response.json()
      setLeads(result.leads || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update lead status')
      }

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus as Lead['status'] } : lead
      ))

      // If this was the selected lead, update it too
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus as Lead['status'] } : null)
      }
    } catch (error: any) {
      setError(error.message)
    }
  }

  useEffect(() => {
    if (advisorId) {
      fetchLeads()
    }
  }, [advisorId])

  // Filter leads based on search and status
  useEffect(() => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.parentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.playerName && lead.playerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.location && lead.location.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, statusFilter])

  const getStatusConfig = (status: string) => {
    return LEAD_STATUSES.find(s => s.value === status) || LEAD_STATUSES[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading leads...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
          <p className="text-gray-600">Manage and track your incoming leads</p>
        </div>
        <Button onClick={fetchLeads} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leads">Lead Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Filter Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {LEAD_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                {LEAD_STATUSES.map(status => {
                  const count = leads.filter(lead => lead.status === status.value).length
                  return (
                    <div key={status.value} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600">{status.label}</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Leads List */}
          <div className="grid gap-4">
            {filteredLeads.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'No leads match your filters' : 'No leads yet'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search criteria'
                      : 'New leads will appear here when parents contact you'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredLeads.map(lead => {
                const statusConfig = getStatusConfig(lead.status)
                const StatusIcon = statusConfig.icon
                
                return (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className={cn("text-xs", statusConfig.color)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {getTimeAgo(lead.createdAt)}
                            </span>
                          </div>

                          {/* Lead Info */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-2">
                                {lead.parentName}
                              </h3>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {lead.parentEmail}
                                </div>
                                
                                {lead.parentPhone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {lead.parentPhone}
                                  </div>
                                )}

                                {lead.location && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {lead.location}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              {lead.playerName && (
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  Player: {lead.playerName}
                                  {lead.playerAge && ` (${lead.playerAge} years old)`}
                                </p>
                              )}
                              
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {lead.message}
                              </p>

                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                Created: {formatDate(lead.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-4">
                          <Select 
                            value={lead.status} 
                            onValueChange={(value) => updateLeadStatus(lead.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STATUSES.map(status => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <LeadAnalytics advisorId={advisorId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}