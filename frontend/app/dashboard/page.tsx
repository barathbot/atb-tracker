"use client"

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
  Coffee,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NavigationLink } from "@/components/navigation-link"
import { ClientsPage } from "@/components/clients-page"
import { ReportsPage } from "@/components/reports-page"
import { ProjectsPage } from "@/components/projects-page"
import { SettingsPage } from "@/components/settings-page"
import { CalendarView } from "@/components/calendar-view"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { TagsPage } from "@/components/tags-page"
import { useAuth } from "@/components/auth/auth-context"
import { useRouter } from "next/navigation"
import { fetchPomodoroSessions, PomodoroSession } from "@/utils/pomodoro-api"

// Notification type definitions
export type NotificationType = "deadline" | "task" | "reminder";
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}
// Add global type definition for teamTags
declare global {
  interface Window {
    teamTags: any[]
  }
}

// import shared Project interface
import { Project } from "@/types/project";
// interface Project {
//   id: string | number;
//   name: string;
//   client?: string;
//   // Add other fields if needed
// }

interface TimeEntry {
  id: string
  task: string
  project: string | number | { name: string; [key: string]: any }
  duration: number // in seconds
  date: string
  type: "regular" | "pomodoro"
  billable: boolean
  tags?: string[]
}

export default function Dashboard() {
  // ...existing state declarations...
  // Add a helper to refresh pomodoro sessions
  async function refreshPomodoroSessions() {
    try {
      const pomodorosData = await fetchPomodoroSessions();
      setPomodoroSessions(pomodorosData);
    } catch (err) {
      console.error("Failed to refresh Pomodoro sessions:", err);
    }
  }
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  

const [projects, setProjects] = useState<Project[]>([])
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)
  const [taskNameSuggestions, setTaskNameSuggestions] = useState<string[]>([])
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([])

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
    let interval: NodeJS.Timeout
    if (isTracking && timerMode === "regular") {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, timerMode])

  // Add this useEffect to check for notifications
  // ...existing code...

// Add this useEffect to check for notifications
useEffect(() => {
  const checkNotifications = () => {
    const newNotifications: Notification[] = []
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

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...prev, ...newNotifications])
    }
  }

  // Call once immediately
  checkNotifications()
  // Then every minute
  const interval = setInterval(checkNotifications, 60000)
  return () => clearInterval(interval)
}, [timeEntries, isTracking, timeElapsed])

// ...existing code...

  // Fetch projects, time entries, and pomodoro sessions from backend on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [projectsData, timeEntriesData, pomodorosData] = await Promise.all([
          (await import("@/utils/projects-api")).fetchProjects(),
          (await import("@/utils/time-entries-api")).fetchTimeEntries(),
          fetchPomodoroSessions()
        ])
        setProjects(projectsData)
        setTimeEntries(timeEntriesData.map((entry: any) => ({
          ...entry,
          task: entry.description,
          duration: entry.duration * 60, // Convert minutes to seconds!
          project: typeof entry.project === 'object' && entry.project.name ? entry.project.name : entry.project
        })))
        setPomodoroSessions(pomodorosData)
      } catch (err) {
        // Optionally handle error
        console.error("Failed to fetch dashboard data:", err)
      }
    }
    fetchInitialData()
    // Click outside logic for dropdowns
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
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
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

  // Suggestion extraction for task names
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEntries = localStorage.getItem('timeEntries')
      if (savedEntries) {
        const entries = JSON.parse(savedEntries)
        setTaskNameSuggestions(Array.from(new Set(entries.map((e: any) => e.task).filter(Boolean))))
      } else {
        setTaskNameSuggestions([])
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

  const handleStartStop = async () => {
    if (timerMode === "pomodoro") return

    const projectObj = projects.find((p: Project) => p.name === selectedProject);
    if (!selectedProject || !projectObj) {
      alert("Please select a project before starting or stopping the timer.");
      return;
    }

    if (isTracking) {
      // Stop tracking and save entry
      if (currentTask.trim() && timeElapsed > 0) {
        try {
          const { createTimeEntry } = await import("@/utils/time-entries-api")
          const entryData = {
            project: Number(projectObj.id),
            description: currentTask,
            start_time: sessionStartTime ? sessionStartTime.toTimeString().split(" ")[0] : "09:00:00",
            end_time: new Date().toTimeString().split(" ")[0],
            duration: Math.round(timeElapsed / 60),
            date: new Date().toISOString().split("T")[0],
            billable: false,
          }
          const newEntry = await createTimeEntry(entryData)
          // Map API TimeEntry (from backend) to UI TimeEntry
          const mappedEntry = {
            id: newEntry.id?.toString() ?? '',
            task: newEntry.description ?? '',
            project: newEntry.project,
            duration: newEntry.duration * 60, // API duration is in minutes, UI expects seconds
            date: newEntry.date,
            type: 'regular', // or infer from context if needed
            billable: newEntry.billable,
            tags: [] as string[], // Add mapping if tags are implemented in backend
          };
          setTimeEntries((prev) => [
  ...prev,
  {
    ...mappedEntry,
    project: String(mappedEntry.project), // keep UI as string for consistency
    type: 'regular', // explicitly restrict to valid TimeEntry type
  } as TimeEntry,
])
        } catch (err) {
          console.error("Failed to save time entry:", err)
        }
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

  const handlePomodoroComplete = async (task: string, duration: number) => {
    if (!selectedProject || !projects.find((p: Project) => p.name === selectedProject)) {
      alert("Please select a project before completing a Pomodoro entry.")
      return
    }
    if (task.trim() && duration > 0) {
      try {
        const { createTimeEntry } = await import("@/utils/time-entries-api")
        const projectObj = projects.find((p: Project) => p.name === selectedProject)
        if (!projectObj) {
          alert("Project not found!");
          return;
        }
        const entryData = {
          project: Number(projectObj.id),
          description: task,
          start_time: "09:00:00",
          end_time: "09:00:00",
          duration: Math.round(duration / 60),
          date: new Date().toISOString().split("T")[0],
          billable: false,
        }
        const newEntry = await createTimeEntry(entryData)
        setTimeEntries((prev) => [
  ...prev,
  {
    id: newEntry.id?.toString() ?? '',
    task: newEntry.description ?? '',
    project: String(newEntry.project), // ensure project is always a string
    duration: (newEntry.duration || 0) * 60, // API duration is in minutes, UI expects seconds
    date: newEntry.date,
    type: 'pomodoro' as 'pomodoro',
    billable: newEntry.billable,
    tags: [] as string[], // Add mapping if tags are implemented in backend
  },
])
      } catch (err) {
        console.error("Failed to save pomodoro entry:", err)
      }
    }
  }

  // Calculate today's total time (regular + pomodoro)
  const getTodayTotal = () => {
    const today = new Date().toISOString().split("T")[0];
    const regularTotal = timeEntries.filter((entry) => entry.date === today).reduce((total, entry) => total + entry.duration, 0);
    const pomodoroTotal = pomodoroSessions.filter((session) => {
      const sessionDate = new Date(session.start_time).toISOString().split("T")[0];
      return sessionDate === today;
    }).reduce((total, session) => total + (session.duration || 0) * 60, 0); // duration is in minutes, convert to seconds
    return regularTotal + pomodoroTotal;
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
    // Use backend-fetched projects and time entries
    const projectTotals = timeEntries.reduce(
  (acc, entry) => {
    let projectName: string = typeof entry.project === 'string' ? entry.project : '';
    if (typeof entry.project === 'number' || (typeof entry.project === 'string' && !isNaN(Number(entry.project)))) {
      const found = projects.find((p: Project) => p.id == entry.project);
      if (found && found.name) projectName = found.name;
      else projectName = String(entry.project);
    } else if (
      typeof entry.project === 'object' &&
      entry.project !== null &&
      'name' in entry.project &&
      typeof entry.project.name === 'string'
    ) {
      projectName = entry.project.name;
    }
    if (!acc[projectName]) {
      acc[projectName] = 0;
    }
    acc[projectName] += entry.duration;
    return acc;
  },
  {} as Record<string, number>,
);
    const allProjects = projects.map((p: Project) => p.name);
    const uniqueProjects = Array.from(new Set([...allProjects, ...Object.keys(projectTotals)]));
    return uniqueProjects
      .map((project) => ({
        project,
        duration: projectTotals[project] || 0,
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 4);
  };

  // Helper to normalize date to YYYY-MM-DD using local time
  const toYMD = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };


  // Merge timeEntries and pomodoroSessions for weekly summary with normalized dates
  const getWeeklySummary = () => {
    const today = new Date();
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + 1 + i); // Monday to Sunday
      weekDays.push({
        day: date.toLocaleDateString("en-US", { weekday: "long" }),
        date: toYMD(date), // Use local date string
        isToday: toYMD(date) === toYMD(today),
      });
    }
    return weekDays.map((day) => {
      const regularTotal = timeEntries
        .filter((entry) => entry.date === day.date)
        .reduce((total, entry) => total + entry.duration, 0);
      const pomodoroTotal = pomodoroSessions
        .filter((session) => toYMD(session.start_time) === day.date)
        .reduce((total, session) => total + ((session.duration || 0) * 60), 0); // duration is in minutes, convert to seconds
      const todayExtra = day.isToday && isTracking ? timeElapsed : 0;
      const final = regularTotal + pomodoroTotal + todayExtra;
      return {
        ...day,
        duration: final,
      };
    });
  };

  const handleSidebarItemClick = (label: string) => {
    setActivePage(label)
    if (label === "CLIENTS") {
      setActiveNavItem("Clients")
    } else if (label === "TIME TRACKER") {
      setActiveNavItem("Home")
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
    { icon: UserCheck, label: "CLIENTS", active: activePage === "CLIENTS" },
    { icon: Tag, label: "TAGS", active: activePage === "TAGS" },
    { icon: Settings, label: "SETTINGS", active: activePage === "SETTINGS" },
  ]

  const navItems = ["Home", "Reports", "Projects", "Clients", "Settings"]

  // Hydration-safe recentProjects state
  const [recentProjects, setRecentProjects] = useState<any[] | null>(null);

  useEffect(() => {
    // Defensive: always set to array if getRecentProjects returns undefined/null
    const recents = getRecentProjects();
    setRecentProjects(Array.isArray(recents) ? recents : []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeEntries, projects]); // <-- add 'projects' as dependency

  const weeklySummary = getWeeklySummary()
  const todayTotal = getTodayTotal()
  const weekTotal = getWeekTotal()

  const renderMainContent = () => {
    switch (activePage) {
      case "CLIENTS":
        return <ClientsPage />
      case "TEAM":
        return <ReportsPage />
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
                    <div className="text-2xl font-bold">
                      {recentProjects === null ? (
                        <span className="text-gray-400">...</span>
                      ) : (
                        Array.isArray(recentProjects) ? recentProjects.length : 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {recentProjects === null
                        ? "Loading..."
                        : Array.isArray(recentProjects) && recentProjects.length > 0
                        ? "Projects with logged time"
                        : "No projects yet"}
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
                    <div className="text-2xl font-bold">{timeEntries.length + pomodoroSessions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {pomodoroSessions.length} Pomodoro sessions
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
                        <Coffee className="h-4 w-4 mr-1" />
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
                            list="task-name-suggestions"
                          />
                          <datalist id="task-name-suggestions">
                            {taskNameSuggestions.map((name) => (
                              <option key={name} value={name} />
                            ))}
                          </datalist>
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
                          disabled={!currentTask.trim() || !selectedProject || !projects.find((p: Project) => p.name === selectedProject) && !isTracking}
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
                    {recentProjects === null ? (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">Loading...</p>
                      </div>
                    ) : Array.isArray(recentProjects) && recentProjects.length > 0 ? (
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
                          <p className="text-sm text-gray-400 mt-1">We'll notify you about deadlines and reminders</p>
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
