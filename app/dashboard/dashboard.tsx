"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  Timer,
  CheckSquare,
  Calendar,
  BarChart3,
  FolderOpen,
  Users,
  UserCheck,
  Tag,
  ChevronDown,
  Settings,
  DollarSign,
  LogOut,
  Clock,
  TrendingUp,
  Target,
  Play,
  Pause,
  Bell,
} from "lucide-react"
import { Button } from "@components/ui/button"
import { Input } from "@components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card"
import { Badge } from "@components/ui/badge"
import { NavigationLink } from "@components/navigation-link"
import { ClientsPage } from "@components/clients-page"
import { TeamPage } from "@components/team-page"
import { ReportsPage } from "@components/reports-page"
import { ProjectsPage } from "@components/projects-page"
import { SettingsPage } from "@components/settings-page"
import { CalendarView } from "@components/calendar-view"
import { PomodoroTimer } from "@components/pomodoro-timer"
import { TagsPage } from "@components/tags-page"
import { useAuth } from "@components/auth/auth-context"
import { useRouter } from "next/navigation"

// Add global type definition for teamTags
declare global {
  interface Window {
    teamTags: any[]
  }
}

interface TimeEntry {
  id: string
  task: string
  project: string
  duration: number // in seconds
  date: string
  type: "regular" | "pomodoro"
  billable: boolean
  tags?: string[]
}

export default function Dashboard() {
  const [currentTask, setCurrentTask] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeNavItem, setActiveNavItem] = useState("Home")
  const [activePage, setActivePage] = useState("TIME TRACKER")
  const [timerMode, setTimerMode] = useState<"regular" | "pomodoro">("regular")
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [notifications, setNotifications] = useState<
    Array<{
      id: string
      title: string
      message: string
      type: "deadline" | "task" | "reminder"
      timestamp: Date
      read: boolean
    }>
  >([])
  const [projects, setProjects] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const savedProjects = localStorage.getItem("userProjects")
      return savedProjects ? JSON.parse(savedProjects) : []
    }
    return []
  })
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)

  const { user, logout } = useAuth()
  const router = useRouter()

  const profileData = {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.picture || "/placeholder.svg?height=32&width=32",
    initials:
      user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U",
  }

  // Initialize global teamTags if it doesn't exist
  useEffect(() => {
    if (typeof window !== "undefined" && !window.teamTags) {
      window.teamTags = [
        {
          id: "1",
          name: "Development",
          color: "bg-blue-500",
          description: "Software development tasks",
        },
        {
          id: "2",
          name: "Design",
          color: "bg-purple-500",
          description: "UI/UX design work",
        },
        {
          id: "3",
          name: "Meeting",
          color: "bg-green-500",
          description: "Team meetings and client calls",
        },
      ]
    }
  }, [])

  // Timer functionality
  useEffect(() => {
    let interval: any
    if (isTracking && timerMode === "regular") {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, timerMode])

  // Add this useEffect to check for notifications
  useEffect(() => {
    const checkNotifications = () => {
      const newNotifications: typeof notifications = []
      const today = new Date()

      // Check for tasks that should be completed today but aren't tracked
      if (timeEntries.length === 0 && today.getHours() > 17) {
        newNotifications.push({
          id: Date.now().toString(),
          title: "No time tracked today",
          message: "You haven't tracked any time today. Don't forget to log your work!",
          type: "task" as const,
          timestamp: new Date(),
          read: false,
        })
      }

      // Check for incomplete pomodoro sessions
      if (isTracking && timeElapsed > 1800) {
        // 30 minutes
        newNotifications.push({
          id: (Date.now() + 1).toString(),
          title: "Long session detected",
          message: "You've been working for over 30 minutes. Consider taking a break!",
          type: "reminder" as const,
          timestamp: new Date(),
          read: false,
        })
      }

      setNotifications((prev) => [...prev, ...newNotifications])
    }

    const interval = setInterval(checkNotifications, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [timeEntries, isTracking, timeElapsed])

  // Add this useEffect to handle clicking outside dropdowns and localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedProjects = localStorage.getItem("userProjects")
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects))
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".notification-dropdown") && !target.closest(".notification-button")) {
        setShowNotifications(false)
      }
      if (!target.closest(".profile-dropdown") && !target.closest(".profile-button")) {
        setShowProfileDropdown(false)
      }
      if (!target.closest(".project-dropdown") && !target.closest(".project-button")) {
        setShowProjectDropdown(false)
      }
    }

    // Listen for storage changes from other tabs/windows
    window.addEventListener("storage", handleStorageChange)

    // Listen for focus events to check for localStorage changes when returning to this tab
    window.addEventListener("focus", handleStorageChange)

    // Check for changes periodically (in case localStorage was updated in the same tab)
    const interval = setInterval(handleStorageChange, 1000)

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleStorageChange)
      clearInterval(interval)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Add this useEffect after the existing ones to refresh projects when returning to TIME TRACKER
  useEffect(() => {
    if (activePage === "TIME TRACKER") {
      const savedProjects = localStorage.getItem("userProjects")
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects))
      }
    }
  }, [activePage])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const handleStartStop = () => {
    if (timerMode === "pomodoro") return

    if (isTracking) {
      // Stop tracking and save entry
      if (currentTask.trim() && timeElapsed > 0) {
        const entry: TimeEntry = {
          id: Date.now().toString(),
          task: currentTask,
          project: selectedProject || "No Project",
          duration: timeElapsed,
          date: new Date().toISOString().split("T")[0],
          type: "regular",
          billable: false,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        }
        setTimeEntries((prev) => [...prev, entry])
      }
      setIsTracking(false)
      setTimeElapsed(0)
      setCurrentTask("")
      setSelectedProject("")
      setSelectedTags([])
      setSessionStartTime(null)
    } else {
      // Start tracking
      if (currentTask.trim()) {
        setIsTracking(true)
        setSessionStartTime(new Date())
      }
    }
  }

  const handlePomodoroTimeUpdate = (seconds: number) => {
    setTimeElapsed(seconds)
  }

  const handlePomodoroComplete = (task: string, duration: number) => {
    if (task.trim() && duration > 0) {
      const entry: TimeEntry = {
        id: Date.now().toString(),
        task: task,
        project: selectedProject || "No Project",
        duration: duration,
        date: new Date().toISOString().split("T")[0],
        type: "pomodoro",
        billable: false,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      }
      setTimeEntries((prev) => [...prev, entry])
    }
  }

  // Calculate today's total time
  const getTodayTotal = () => {
    const today = new Date().toISOString().split("T")[0]
    return timeEntries.filter((entry) => entry.date === today).reduce((total, entry) => total + entry.duration, 0)
  }

  // Calculate this week's total time
  const getWeekTotal = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0]

    return timeEntries
      .filter((entry) => entry.date >= startOfWeekStr)
      .reduce((total, entry) => total + entry.duration, 0)
  }

  const handleProjectClick = (projectName: string) => {
    setActivePage("PROJECTS")
    // You can add additional logic here to filter or highlight the specific project
  }

  // Get recent projects with time
  const getRecentProjects = () => {
    // Get projects from localStorage
    const storedProjects = localStorage.getItem("userProjects")
    const userProjects = storedProjects ? JSON.parse(storedProjects) : []

    const projectTotals = timeEntries.reduce(
      (acc, entry) => {
        if (!acc[entry.project]) {
          acc[entry.project] = 0
        }
        acc[entry.project] += entry.duration
        return acc
      },
      {} as Record<string, number>,
    )

    // Combine stored projects with time entries
    const allProjects = [...userProjects.map((p) => p.name), ...Object.keys(projectTotals)]
    const uniqueProjects = Array.from(new Set(allProjects))

    return uniqueProjects
      .map((project) => ({
        project,
        duration: projectTotals[project] || 0,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 4)
  }

  // Get this week's daily summary
  const getWeeklySummary = () => {
    const today = new Date()
    const weekDays: Array<{ day: string; date: string; isToday: boolean }> = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() - today.getDay() + 1 + i) // Monday to Sunday
      weekDays.push({
        day: date.toLocaleDateString("en-US", { weekday: "long" }),
        date: date.toISOString().split("T")[0],
        isToday: date.toDateString() === today.toDateString(),
      })
    }

    return weekDays.map((day) => {
      const dayTotal = timeEntries
        .filter((entry) => entry.date === day.date)
        .reduce((total, entry) => total + entry.duration, 0)

      return {
        ...day,
        duration: dayTotal,
      }
    })
  }

  const handleSidebarItemClick = (label: string) => {
    setActivePage(label)
    if (label === "CLIENTS") {
      setActiveNavItem("Clients")
    } else if (label === "TIME TRACKER") {
      setActiveNavItem("Home")
    } else if (label === "TEAM") {
      setActiveNavItem("Teams")
    } else if (label === "REPORTS") {
      setActiveNavItem("Reports")
    } else if (label === "PROJECTS") {
      setActiveNavItem("Projects")
    } else if (label === "SETTINGS") {
      setActiveNavItem("Settings")
    } else if (label === "CALENDAR") {
      setActiveNavItem("Home")
    } else if (label === "TAGS") {
      setActiveNavItem("Home")
    }
  }

  const sidebarItems = [
    { icon: Timer, label: "TIME TRACKER", active: activePage === "TIME TRACKER" },
    { icon: Calendar, label: "CALENDAR", active: activePage === "CALENDAR" },
    { icon: BarChart3, label: "DASHBOARD" },
    { icon: BarChart3, label: "REPORTS", hasSubmenu: true, active: activePage === "REPORTS" },
    { icon: FolderOpen, label: "PROJECTS", active: activePage === "PROJECTS" },
    { icon: Users, label: "TEAM", active: activePage === "TEAM" },
    { icon: UserCheck, label: "CLIENTS", active: activePage === "CLIENTS" },
    { icon: Tag, label: "TAGS", active: activePage === "TAGS" },
    { icon: Settings, label: "SETTINGS", active: activePage === "SETTINGS" },
  ]

  const navItems = ["Home", "Reports", "Projects", "Clients", "Teams", "Settings"]

  const recentProjects = getRecentProjects()
  const weeklySummary = getWeeklySummary()
  const todayTotal = getTodayTotal()
  const weekTotal = getWeekTotal()

  const renderMainContent = () => {
    switch (activePage) {
      case "CLIENTS":
        return <ClientsPage />
      case "TEAM":
        return <TeamPage />
      case "REPORTS":
        return <ReportsPage />
      case "PROJECTS":
        return <ProjectsPage />
      case "SETTINGS":
        return <SettingsPage />
      case "CALENDAR":
        return <CalendarView />
      case "TAGS":
        return <TagsPage />
      case "TIME TRACKER":
      default:
        return (
          <div className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Today's Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {todayTotal > 0 ? formatDuration(todayTotal + timeElapsed) : "0h 0m"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isTracking ? "Currently tracking..." : "Start tracking to see progress"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Week</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {weekTotal > 0 ? formatDuration(weekTotal + timeElapsed) : "0h 0m"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {weekTotal > 0 ? `${timeEntries.length} sessions logged` : "No time logged yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{recentProjects.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {recentProjects.length > 0 ? "Projects with logged time" : "No projects yet"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <button onClick={() => setActivePage("SETTINGS")} className="cursor-pointer">
                      <DollarSign className="h-4 w-4 text-muted-foreground hover:text-purple-600 transition-colors" />
                    </button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{timeEntries.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {timeEntries.filter((e) => e.type === "pomodoro").length} Pomodoro sessions
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Timer Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Time Tracker</CardTitle>
                      <CardDescription>Track your work time with regular timer or Pomodoro technique</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={timerMode === "regular" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimerMode("regular")}
                        className="flex items-center"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Regular
                      </Button>
                      <Button
                        variant={timerMode === "pomodoro" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimerMode("pomodoro")}
                        className="flex items-center"
                      >
                        <Target className="h-4 w-4 mr-1" />
                        Pomodoro
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {timerMode === "regular" ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Input
                            placeholder="What are you working on?"
                            value={currentTask}
                            onChange={(e) => setCurrentTask(e.target.value)}
                            className="text-lg"
                          />
                        </div>

                        <div className="relative">
                          <Button
                            variant="ghost"
                            className="flex items-center space-x-1 text-purple-500 project-button"
                            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                          >
                            <FolderOpen className="h-5 w-5" />
                            <span>{selectedProject || "Project"}</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>

                          {showProjectDropdown && (
                            <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto project-dropdown">
                              <div className="p-2">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1">
                                  Select Project
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedProject("")
                                    setShowProjectDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                >
                                  No Project
                                </button>
                                {projects.length > 0 ? (
                                  projects.map((project) => (
                                    <button
                                      key={project.id}
                                      onClick={() => {
                                        setSelectedProject(project.name)
                                        setShowProjectDropdown(false)
                                      }}
                                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center justify-between"
                                    >
                                      <span>{project.name}</span>
                                      <span className="text-xs text-gray-500">{project.client}</span>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-4 text-center text-gray-500">
                                    <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No projects yet</p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 text-purple-600 border-purple-600 hover:bg-purple-50"
                                      onClick={() => {
                                        setActivePage("PROJECTS")
                                        setShowProjectDropdown(false)
                                      }}
                                    >
                                      Create Project
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          className="text-gray-400 hover:text-purple-500"
                          onClick={() => setActivePage("TAGS")}
                        >
                          <Tag className="h-5 w-5" />
                        </Button>

                        <Button
                          variant="ghost"
                          className="text-gray-400 hover:text-purple-500"
                          onClick={() => setActivePage("SETTINGS")}
                        >
                          <DollarSign className="h-5 w-5" />
                        </Button>

                        <div className="text-2xl font-mono text-gray-700 min-w-[120px] text-center">
                          {formatTime(timeElapsed)}
                        </div>

                        <Button
                          onClick={handleStartStop}
                          disabled={!currentTask.trim() && !isTracking}
                          className={`px-8 py-2 font-semibold ${
                            isTracking
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white disabled:opacity-50"
                          }`}
                        >
                          {isTracking ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              STOP
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              START
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <PomodoroTimer onTimeUpdate={handlePomodoroTimeUpdate} onComplete={handlePomodoroComplete} />
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Projects</CardTitle>
                    <CardDescription>Your most active projects this week</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentProjects.length > 0 ? (
                      recentProjects.map((project, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          onClick={() => handleProjectClick(project.project)}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500"][index % 4]
                              }`}
                            ></div>
                            <span className="font-medium">{project.project}</span>
                          </div>
                          <Badge variant="secondary">{formatDuration(project.duration)}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No projects tracked yet</p>
                        <p className="text-xs text-gray-400 mt-1">Start tracking time to see your projects here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>This Week's Summary</CardTitle>
                    <CardDescription>Your daily productivity overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {weeklySummary.some((day) => day.duration > 0) ? (
                      <div className="space-y-2">
                        {weeklySummary.map((day, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className={day.isToday ? "text-purple-600 font-medium" : ""}>
                              {day.day}
                              {day.isToday && " (Today)"}
                            </span>
                            <span className={`font-medium ${day.isToday ? "text-purple-600" : ""}`}>
                              {day.duration > 0 ? formatDuration(day.duration) : "0m"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No time logged this week</p>
                        <p className="text-xs text-gray-400 mt-1">Start your first session to see daily summaries</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setActivePage("CALENDAR")}
                    >
                      <Calendar className="h-6 w-6" />
                      <span className="text-sm">View Calendar</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setActivePage("REPORTS")}
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-sm">Reports</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setActivePage("PROJECTS")}
                    >
                      <FolderOpen className="h-6 w-6" />
                      <span className="text-sm">Projects</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                      onClick={() => setActivePage("TAGS")}
                    >
                      <Tag className="h-6 w-6" />
                      <span className="text-sm">Tags</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-300 to-blue-400 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white/90 backdrop-blur-sm border-r border-white/20 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg px-3 py-2">
              <Timer className="h-5 w-5 text-white" />
              <CheckSquare className="h-4 w-4 text-white" />
              <span className="text-white font-bold text-lg">ATB Tracker</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {sidebarItems.map((item, index) => (
              <div key={index}>
                <button
                  onClick={() => handleSidebarItemClick(item.label)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    item.active
                      ? "bg-purple-100 text-purple-600 border-l-4 border-purple-600"
                      : "text-gray-600 hover:bg-purple-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.hasSubmenu && <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>
                {index === 2 && (
                  <div className="mt-4 mb-2">
                    <div className="text-xs font-semibold text-purple-500 uppercase tracking-wider px-3">ANALYZE</div>
                  </div>
                )}
                {index === 4 && (
                  <div className="mt-4 mb-2">
                    <div className="text-xs font-semibold text-purple-500 uppercase tracking-wider px-3">MANAGE</div>
                  </div>
                )}
                {index === 6 && (
                  <div className="mt-4 mb-2">
                    <div className="text-xs font-semibold text-purple-500 uppercase tracking-wider px-3">TEAM</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Logout Link */}
        <div className="p-4 border-t border-white/20">
          <NavigationLink
            href="/signup"
            variant="outline"
            className="w-full text-purple-600 border-purple-600 hover:bg-purple-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Back to Sign Up
          </NavigationLink>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Purple Navigation Bar with Icons */}
        <nav className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setActiveNavItem(item)
                    if (item === "Clients") {
                      setActivePage("CLIENTS")
                    } else if (item === "Home") {
                      setActivePage("TIME TRACKER")
                    } else if (item === "Teams") {
                      setActivePage("TEAM")
                    } else if (item === "Reports") {
                      setActivePage("REPORTS")
                    } else if (item === "Projects") {
                      setActivePage("PROJECTS")
                    } else if (item === "Settings") {
                      setActivePage("SETTINGS")
                    }
                  }}
                  className={`text-white font-medium transition-colors hover:text-purple-100 ${
                    activeNavItem === item ? "border-b-2 border-white pb-1" : ""
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Icons moved to navigation bar */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActivePage("SETTINGS")}
                className="text-white cursor-pointer hover:text-purple-100 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative cursor-pointer">
                  <div
                    className={`w-6 h-6 ${notifications.filter((n) => !n.read).length > 0 ? "bg-orange-500" : "bg-gray-400"} rounded-full flex items-center justify-center`}
                  >
                    <span className="text-white text-xs font-bold">
                      {notifications.filter((n) => !n.read).length || "0"}
                    </span>
                  </div>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No notifications yet</p>
                          <p className="text-sm text-gray-400">We'll notify you about deadlines and reminders</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`w-2 h-2 rounded-full mt-2 ${
                                  notification.type === "deadline"
                                    ? "bg-red-500"
                                    : notification.type === "task"
                                      ? "bg-orange-500"
                                      : "bg-blue-500"
                                }`}
                              ></div>
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-800">{notification.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {notification.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200">
                        <button
                          onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="w-8 h-8 bg-gradient-to-r from-purple-800 to-blue-800 rounded-full flex items-center justify-center cursor-pointer border-2 border-white/20 hover:border-white/40 transition-colors"
                >
                  <span className="text-white text-sm font-bold">{profileData.initials}</span>
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{profileData.initials}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{profileData.name}</h3>
                          <p className="text-sm text-gray-600">{profileData.email}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Today's Time:</span>
                          <span className="font-medium">
                            {todayTotal > 0 ? formatDuration(todayTotal + timeElapsed) : "0h 0m"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">This Week:</span>
                          <span className="font-medium">
                            {weekTotal > 0 ? formatDuration(weekTotal + timeElapsed) : "0h 0m"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Sessions:</span>
                          <span className="font-medium">{timeEntries.length}</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false)
                            router.push("/settings")
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          See more in Settings
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false)
                            logout()
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md flex items-center mt-1"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Dashboard Content */}
        {renderMainContent()}
      </div>
    </div>
  )
}
