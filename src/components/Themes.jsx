import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { getFeedbacks } from '@/services/api'
import { Loader2 } from 'lucide-react'

// Capitalize first letter of each word, with special handling for API and UI/UX
const capitalizeWords = (str) => {
  if (!str) return str
  
  const lowerStr = str.toLowerCase()
  if (lowerStr === 'api') return 'API'
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
  
  return str
    .split(/[\s_-]+/)
    .map(word => {
      const lowerWord = word.toLowerCase()
      if (lowerWord === 'api') return 'API'
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

const Themes = () => {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await getFeedbacks({ limit: 1000 })
      setFeedbacks(response.feedbacks || [])
    } catch (error) {
      console.error('Failed to load feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate theme distribution
  const themeData = useMemo(() => {
    const themeMap = new Map()
    
    feedbacks.forEach(feedback => {
      const theme = feedback.analysis?.theme || 'Uncategorized'
      const count = themeMap.get(theme) || 0
      themeMap.set(theme, count + 1)
    })

    return Array.from(themeMap.entries())
      .map(([name, count]) => ({
        name: capitalizeWords(name),
        count,
        originalName: name,
      }))
      .sort((a, b) => b.count - a.count)
  }, [feedbacks])

  // Calculate bug severity distribution
  const bugSeverityData = useMemo(() => {
    const severityMap = new Map()
    
    feedbacks.forEach(feedback => {
      const analysis = feedback.analysis
      if (analysis?.type === 'bug' && analysis.severity) {
        const severity = analysis.severity
        const count = severityMap.get(severity) || 0
        severityMap.set(severity, count + 1)
      }
    })

    const severityConfig = {
      'P0': { name: 'P0 (Critical)', color: '#ef4444', order: 0 },
      'P1': { name: 'P1 (Major)', color: '#f97316', order: 1 },
      'P2': { name: 'P2 (Minor)', color: '#eab308', order: 2 },
      'P3': { name: 'P3 (Cosmetic)', color: '#3b82f6', order: 3 },
    }

    return Array.from(severityMap.entries())
      .map(([key, value]) => {
        const config = severityConfig[key] || { 
          name: key, 
          color: '#8884d8', 
          order: 999 
        }
        return {
          name: config.name,
          value,
          color: config.color,
          order: config.order,
        }
      })
      .sort((a, b) => a.order - b.order)
  }, [feedbacks])

  // Calculate feedback priority distribution
  const feedbackPriorityData = useMemo(() => {
    const priorityMap = new Map()
    
    feedbacks.forEach(feedback => {
      const analysis = feedback.analysis
      if (analysis?.type === 'feedback' && analysis.priority) {
        const priority = analysis.priority
        const count = priorityMap.get(priority) || 0
        priorityMap.set(priority, count + 1)
      }
    })

    const priorityConfig = {
      'high': { name: 'High', color: '#ef4444', order: 0 },
      'medium-high': { name: 'Medium High', color: '#f97316', order: 1 },
      'medium': { name: 'Medium', color: '#eab308', order: 2 },
      'low': { name: 'Low', color: '#3b82f6', order: 3 },
    }

    return Array.from(priorityMap.entries())
      .map(([key, value]) => {
        const config = priorityConfig[key] || { 
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' '), 
          color: '#8884d8', 
          order: 999 
        }
        return {
          name: config.name,
          value,
          color: config.color,
          order: config.order,
        }
      })
      .sort((a, b) => a.order - b.order)
  }, [feedbacks])

  // Calculate total counts
  const totalTickets = feedbacks.length
  const activeThemes = themeData.length
  const bugsCount = feedbacks.filter(f => f.analysis?.type === 'bug').length
  const feedbackCount = feedbacks.filter(f => f.analysis?.type === 'feedback').length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading themes data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Themes Overview</h1>
        <p className="text-muted-foreground mt-2">
          Analyze feedback patterns and trends across different themes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Tickets</CardTitle>
            <CardDescription>All time feedback submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTickets}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {bugsCount} bugs • {feedbackCount} feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Themes</CardTitle>
            <CardDescription>Categories with recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeThemes}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all feedback types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Theme</CardTitle>
            <CardDescription>Most common feedback category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{themeData[0]?.name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {themeData[0]?.count || 0} tickets
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bug Severity Distribution</CardTitle>
            <CardDescription>Breakdown of bugs by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            {bugSeverityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={bugSeverityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => {
                      // Only show label if slice is large enough
                      if (percent < 0.05) return ''
                      return `${name}\n${value} (${(percent * 100).toFixed(0)}%)`
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bugSeverityData.map((entry, index) => (
                      <Cell key={`bug-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} bugs`,
                      props.payload.name
                    ]}
                  />
                  <Legend 
                    formatter={(value, entry) => entry.payload.name}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No bug severity data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Priority Distribution</CardTitle>
            <CardDescription>Breakdown of feedback by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackPriorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={feedbackPriorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => {
                      // Only show label if slice is large enough
                      if (percent < 0.05) return ''
                      return `${name}\n${value} (${(percent * 100).toFixed(0)}%)`
                    }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {feedbackPriorityData.map((entry, index) => (
                      <Cell key={`feedback-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} feedback items`,
                      props.payload.name
                    ]}
                  />
                  <Legend 
                    formatter={(value, entry) => entry.payload.name}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No feedback priority data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme Summary</CardTitle>
          <CardDescription>Detailed breakdown of feedback themes</CardDescription>
        </CardHeader>
        <CardContent>
          {themeData.length > 0 ? (
            <div className="space-y-4">
              {themeData.map((theme) => {
                const maxCount = themeData[0]?.count || 1
                const percentage = ((theme.count / maxCount) * 100).toFixed(0)
                
                return (
                  <div key={theme.originalName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{theme.name}</span>
                        <span className="text-sm text-muted-foreground">{theme.count} tickets</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-2xl font-bold">{theme.count}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No theme data available. Analyze some feedbacks to see theme distribution.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Themes
