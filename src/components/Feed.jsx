import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Clock, User, Tag, ChevronDown, ChevronUp, Loader2, Bug, MessageSquare, AlertCircle, Download } from 'lucide-react'
import { getFeedbacks, downloadFeedbacks } from '@/services/api'

// Mock data for tickets
const mockTickets = [
  {
    id: 1,
    title: 'Slow page load times on dashboard',
    description: 'Users are reporting that the dashboard takes 5+ seconds to load. This is affecting user experience significantly.',
    status: 'new',
    priority: 'high',
    author: 'john.doe@example.com',
    timestamp: '2 hours ago',
    tags: ['performance', 'dashboard', 'urgent'],
  },
  {
    id: 2,
    title: 'Request for dark mode support',
    description: 'Multiple users have requested dark mode functionality. This would improve usability during night hours.',
    status: 'in-progress',
    priority: 'medium',
    author: 'sarah.smith@example.com',
    timestamp: '5 hours ago',
    tags: ['ui', 'feature-request'],
  },
  {
    id: 3,
    title: 'Mobile app crashes on iOS 17',
    description: 'The mobile app crashes immediately after launch on iOS 17 devices. This is blocking all iOS users.',
    status: 'new',
    priority: 'critical',
    author: 'mike.jones@example.com',
    timestamp: '1 day ago',
    tags: ['mobile', 'ios', 'crash'],
  },
  {
    id: 4,
    title: 'Add export functionality to reports',
    description: 'Users want to export their reports to PDF and CSV formats. This would enhance the reporting capabilities.',
    status: 'new',
    priority: 'low',
    author: 'emily.brown@example.com',
    timestamp: '2 days ago',
    tags: ['feature-request', 'reports'],
  },
  {
    id: 5,
    title: 'Improve search accuracy',
    description: 'The search function is not returning relevant results. Users are having difficulty finding what they need.',
    status: 'in-progress',
    priority: 'medium',
    author: 'david.wilson@example.com',
    timestamp: '3 days ago',
    tags: ['search', 'usability'],
  },
]

const getSeverityColor = (severity) => {
  const colors = {
    P0: 'bg-red-600',
    P1: 'bg-orange-500',
    P2: 'bg-yellow-500',
    P3: 'bg-blue-500',
  }
  return colors[severity] || colors.P2
}

const getPriorityColor = (priority) => {
  const colors = {
    high: 'bg-orange-500',
    'medium-high': 'bg-yellow-500',
    medium: 'bg-blue-500',
    low: 'bg-gray-500',
  }
  return colors[priority] || colors.medium
}

const getStatusColor = (status) => {
  const colors = {
    new: 'bg-blue-500',
    'in-progress': 'bg-yellow-500',
    resolved: 'bg-green-500',
    closed: 'bg-gray-500',
  }
  return colors[status] || colors.new
}

const getSeverityWeight = (severity) => {
  const weights = {
    P0: 4,
    P1: 3,
    P2: 2,
    P3: 1,
  }
  return weights[severity] || 0
}

const getPriorityWeight = (priority) => {
  const weights = {
    high: 4,
    'medium-high': 3,
    medium: 2,
    low: 1,
  }
  return weights[priority] || 0
}

const getUserTierWeight = (tier) => {
  const weights = {
    Enterprise: 1.0,
    Business: 0.7,
    Free: 0.1,
    Unknown: 0.5,
  }
  return weights[tier] || 0.5
}

// Capitalize first letter of each word, with special handling for API and UI/UX
const capitalizeWords = (str) => {
  if (!str) return str
  
  // Handle special cases that should be fully capitalized
  const specialCases = {
    'api': 'API',
    'ui': 'UI',
    'ux': 'UX',
    'ui/ux': 'UI/UX',
    'ui-ux': 'UI/UX',
    'ui_ux': 'UI/UX',
  }
  
  const lowerStr = str.toLowerCase()
  if (specialCases[lowerStr]) {
    return specialCases[lowerStr]
  }
  
  // Check if it contains UI/UX patterns
  if (lowerStr.includes('ui') && lowerStr.includes('ux')) {
    return str
      .split(/[\s_-]+/)
      .map(word => {
        const lowerWord = word.toLowerCase()
        if (lowerWord === 'ui' || lowerWord === 'ux') {
          return word.toUpperCase()
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join('/')
  }
  
  // Check if it's just "api"
  if (lowerStr === 'api') {
    return 'API'
  }
  
  // Regular capitalization
  return str
    .split(/[\s_-]+/)
    .map(word => {
      const lowerWord = word.toLowerCase()
      if (lowerWord === 'api') {
        return 'API'
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

// Calculate impact score for feedback (higher = more impactful)
const calculateFeedbackScore = (ticket, analysis) => {
  let score = 0
  
  // User tier weight
  const tierWeight = getUserTierWeight(analysis?.userTier || 'Unknown')
  score += tierWeight * 10
  
  // Priority weight
  const priorityWeight = getPriorityWeight(analysis?.priority || 'medium')
  score += priorityWeight * 5
  
  // Sentiment (negative feedback might be more impactful)
  if (analysis?.sentiment === 'negative') score += 3
  if (analysis?.sentiment === 'positive') score += 1
  
  // Status (new issues might be more impactful)
  if (ticket.status === 'new') score += 2
  
  return score
}

const Feed = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiAnalysis, setAiAnalysis] = useState({})
  const [expandedSections, setExpandedSections] = useState({}) // Track bug/feedback section expansion
  const [downloading, setDownloading] = useState({})

  // Fetch feedbacks from D1 on mount
  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await getFeedbacks({ limit: 1000 })
      setTickets(response.feedbacks || [])
      
      // Pre-populate AI analysis from stored data (used for grouping and display)
      const analysisMap = {}
      response.feedbacks?.forEach(feedback => {
        if (feedback.analysis) {
          analysisMap[feedback.id] = feedback.analysis
        }
      })
      setAiAnalysis(analysisMap)
    } catch (error) {
      console.error('Failed to load feedbacks:', error)
      // Fallback to mock data if API fails
      setTickets(mockTickets)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (theme, type = null) => {
    const key = `${theme}_${type || 'all'}`
    setDownloading(prev => ({ ...prev, [key]: true }))
    
    try {
      await downloadFeedbacks({ theme, type })
    } catch (error) {
      console.error('Failed to download feedbacks:', error)
      alert('Failed to download feedbacks. Make sure the Worker is running.')
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }))
    }
  }


  const toggleThemeExpanded = (theme) => {
    setExpandedThemes(prev => ({
      ...prev,
      [theme]: !prev[theme]
    }))
  }

  const toggleSectionExpanded = (theme, section) => {
    const key = `${theme}_${section}`
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }


  // Group and organize tickets by theme, then by bug/feedback with aggregation
  const organizedTickets = useMemo(() => {
    const themeMap = new Map()

    tickets.forEach(ticket => {
      const analysis = aiAnalysis[ticket.id]
      if (!analysis) return // Skip tickets without analysis
      
      const theme = analysis.theme || 'Uncategorized'
      const type = analysis.type || 'feedback'
      
      if (!themeMap.has(theme)) {
        themeMap.set(theme, {
          theme,
          bugs: [],
          feedback: [],
        })
      }
      
      const themeData = themeMap.get(theme)
      const ticketData = {
        ...ticket,
        analysis,
        feedbackScore: type === 'feedback' ? calculateFeedbackScore(ticket, analysis) : 0,
      }
      
      if (type === 'bug') {
        themeData.bugs.push(ticketData)
      } else {
        themeData.feedback.push(ticketData)
      }
    })

    // Sort and calculate aggregated values for each theme
    const themesWithAggregation = Array.from(themeMap.values()).map(themeData => {
      // Sort bugs by severity (P0 > P1 > P2 > P3)
      themeData.bugs.sort((a, b) => {
        const severityA = getSeverityWeight(a.analysis?.severity || 'P2')
        const severityB = getSeverityWeight(b.analysis?.severity || 'P2')
        return severityB - severityA
      })
      
      // Sort feedback by impact score
      themeData.feedback.sort((a, b) => b.feedbackScore - a.feedbackScore)

      // Calculate aggregated severity for bugs
      let aggregatedSeverity = null
      if (themeData.bugs.length > 0) {
        const severities = themeData.bugs.map(b => b.analysis?.severity).filter(s => s)
        if (severities.includes('P0')) aggregatedSeverity = 'P0'
        else if (severities.includes('P1')) aggregatedSeverity = 'P1'
        else if (severities.includes('P2')) aggregatedSeverity = 'P2'
        else if (severities.includes('P3')) aggregatedSeverity = 'P3'
      }

      // Calculate aggregated priority for feedback
      let aggregatedPriority = null
      if (themeData.feedback.length > 0) {
        let totalWeight = 0
        let weightedSum = 0

        themeData.feedback.forEach(f => {
          const tierWeight = getUserTierWeight(f.analysis?.userTier || 'Unknown')
          const priorityWeight = getPriorityWeight(f.analysis?.priority || 'medium')
          const combinedWeight = tierWeight * priorityWeight
          weightedSum += combinedWeight
          totalWeight += tierWeight
        })

        const avgWeight = totalWeight > 0 ? weightedSum / totalWeight : 0
        
        if (avgWeight >= 3.5) aggregatedPriority = 'high'
        else if (avgWeight >= 2.5) aggregatedPriority = 'medium-high'
        else if (avgWeight >= 1.5) aggregatedPriority = 'medium'
        else aggregatedPriority = 'low'
      }

      // Determine traffic light color
      let trafficLight = 'green'
      if (aggregatedSeverity === 'P0' || aggregatedPriority === 'high') {
        trafficLight = 'red'
      } else if (aggregatedSeverity === 'P1' || aggregatedPriority === 'medium-high') {
        trafficLight = 'yellow'
      } else if (aggregatedSeverity === 'P2' || aggregatedPriority === 'medium') {
        trafficLight = 'yellow'
      } else {
        trafficLight = 'green'
      }

      return {
        ...themeData,
        aggregatedSeverity,
        aggregatedPriority,
        trafficLight,
        totalCount: themeData.bugs.length + themeData.feedback.length,
      }
    })

    // Sort by traffic light (red first, then yellow, then green), then by total count
    themesWithAggregation.sort((a, b) => {
      const lightOrder = { 'red': 0, 'yellow': 1, 'green': 2 }
      const aOrder = lightOrder[a.trafficLight] || 2
      const bOrder = lightOrder[b.trafficLight] || 2
      if (aOrder !== bOrder) return aOrder - bOrder
      return b.totalCount - a.totalCount
    })

    return themesWithAggregation
  }, [tickets, aiAnalysis])


  const TicketCard = ({ ticket, analysis }) => {
    const isBug = analysis?.type === 'bug'
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{ticket.title}</CardTitle>
              <CardDescription className="text-sm">
                {ticket.description}
              </CardDescription>
            </div>
            <div className="flex gap-2 ml-4">
              {isBug && analysis?.severity && (
                <Badge
                  variant="outline"
                  className={`${getSeverityColor(analysis.severity)} text-white border-0`}
                >
                  {analysis.severity}
                </Badge>
              )}
              {!isBug && analysis?.priority && (
                <Badge
                  variant="outline"
                  className={`${getPriorityColor(analysis.priority)} text-white border-0`}
                >
                  {analysis.priority}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`${getStatusColor(ticket.status)} text-white border-0`}
              >
                {ticket.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{ticket.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{ticket.timestamp}</span>
            </div>
            {analysis?.userTier && analysis.userTier !== 'Unknown' && (
              <Badge variant="secondary" className="text-xs">
                {analysis.userTier}
              </Badge>
            )}
            <div className="flex items-center gap-2 flex-1">
              <Tag className="h-4 w-4" />
              <div className="flex gap-2 flex-wrap">
                {ticket.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading feedbacks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback Feed</h1>
          <p className="text-muted-foreground mt-2">
            View and manage incoming product feedback tickets organized by theme with AI-powered analysis
          </p>
        </div>
        <Button onClick={() => downloadFeedbacks()} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download All
        </Button>
      </div>

      <div className="space-y-8">
        {organizedTickets.map(({ theme, bugs, feedback, aggregatedSeverity, aggregatedPriority, trafficLight, totalCount }) => {
          const topBugs = bugs.slice(0, 5)
          const topFeedback = feedback.slice(0, 5)

          return (
            <Card key={theme} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{capitalizeWords(theme)}</CardTitle>
                    <CardDescription>
                      {totalCount} total tickets • {bugs.length} bugs • {feedback.length} feedback
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    {aggregatedSeverity && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Bug</p>
                        <p className="text-xs text-muted-foreground">Severity</p>
                        <Badge className={`${getSeverityColor(aggregatedSeverity)} text-white border-0 mt-1`}>
                          {aggregatedSeverity}
                        </Badge>
                      </div>
                    )}
                    {aggregatedPriority && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Feedback</p>
                        <p className="text-xs text-muted-foreground">Priority</p>
                        <Badge className={`${getPriorityColor(aggregatedPriority)} text-white border-0 mt-1`}>
                          {aggregatedPriority}
                        </Badge>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(theme)}
                      disabled={downloading[`${theme}_all`]}
                    >
                      {downloading[`${theme}_all`] ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bugs Section */}
                {bugs.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSectionExpanded(theme, 'bugs')}
                          className="h-auto p-0"
                        >
                          {expandedSections[`${theme}_bugs`] !== false ? (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronUp className="h-4 w-4 mr-1" />
                          )}
                        </Button>
                        <Bug className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-semibold">Bugs</h3>
                        <Badge variant="secondary">{bugs.length}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(theme, 'bug')}
                        disabled={downloading[`${theme}_bug`]}
                      >
                        {downloading[`${theme}_bug`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {expandedSections[`${theme}_bugs`] !== false && (
                      <div className="grid gap-4">
                      {topBugs.map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          analysis={ticket.analysis}
                        />
                      ))}
                        {bugs.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            +{bugs.length - 5} more bugs (showing top 5 critical)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback Section */}
                {feedback.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSectionExpanded(theme, 'feedback')}
                          className="h-auto p-0"
                        >
                          {expandedSections[`${theme}_feedback`] !== false ? (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          ) : (
                            <ChevronUp className="h-4 w-4 mr-1" />
                          )}
                        </Button>
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold">Feedback</h3>
                        <Badge variant="secondary">{feedback.length}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(theme, 'feedback')}
                        disabled={downloading[`${theme}_feedback`]}
                      >
                        {downloading[`${theme}_feedback`] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {expandedSections[`${theme}_feedback`] !== false && (
                      <div className="grid gap-4">
                      {topFeedback.map((ticket) => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          analysis={ticket.analysis}
                        />
                      ))}
                        {feedback.length > 5 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            +{feedback.length - 5} more feedback items (showing top 5 impactful)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {bugs.length === 0 && feedback.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tickets in this theme yet. Analyze tickets to categorize them.
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}

        {organizedTickets.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No tickets organized yet. Analyze tickets to see them grouped by theme.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Feed
