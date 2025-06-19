"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, DollarSign, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  fetchTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  TimeEntry as APITimeEntry
} from "../utils/time-entries-api"

interface TimeEntry {
  id: number
  project: number
  projectName: string
  projectColor: string
  description: string
  startTime: string
  endTime: string
  duration: number // in minutes
  date: string
  billable: boolean
}

type NewEntry = {
  project: number | "";
  description: string;
  startTime: string;
  endTime: string;
  billable: boolean;
};

interface Project {
  id: string
  name: string
  color: string
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntry, setNewEntry] = useState<NewEntry>({
    project: "",
    description: "",
    startTime: "09:00",
    endTime: "17:00",
    billable: true,
  })
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)

  // Sample projects - Keep these as available options but no default entries
  const projects: Project[] = [
    { id: "1", name: "Web Development", color: "bg-blue-500" },
    { id: "2", name: "Mobile App", color: "bg-green-500" },
    { id: "3", name: "Design Work", color: "bg-purple-500" },
    { id: "4", name: "Client Meeting", color: "bg-orange-500" },
    { id: "5", name: "Research", color: "bg-pink-500" },
  ]

  // Backend time entries
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  useEffect(() => {
    setLoadingEntries(true)
    fetchTimeEntries()
      .then((data: APITimeEntry[]) => {
        setTimeEntries(
          data.map((entry) => {
            const projectObj = projects.find((p) => String(p.id) === String(entry.project))
            return {
              id: entry.id!,
              project: entry.project,
              projectName: projectObj?.name || String(entry.project),
              projectColor: projectObj?.color || "bg-gray-500",
              description: entry.description,
              startTime: entry.start_time,
              endTime: entry.end_time,
              duration: entry.duration,
              date: entry.date,
              billable: entry.billable,
            }
          })
        )
      })
      .catch(() => setTimeEntries([]))
      .finally(() => setLoadingEntries(false))
  }, [])

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    // Adjust for starting week on Monday (0 = Monday, 6 = Sunday)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1

    const days = []

    // Add days from previous month
    const prevMonth = month === 0 ? 11 : month - 1
    const prevMonthYear = month === 0 ? year - 1 : year
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth)

    for (let i = 0; i < adjustedFirstDay; i++) {
      const day = daysInPrevMonth - adjustedFirstDay + i + 1
      days.push({
        date: new Date(prevMonthYear, prevMonth, day),
        isCurrentMonth: false,
      })
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    // Add days from next month
    const remainingDays = 42 - days.length // 6 rows of 7 days
    const nextMonth = month === 11 ? 0 : month + 1
    const nextMonthYear = month === 11 ? year + 1 : year

    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(nextMonthYear, nextMonth, i),
        isCurrentMonth: false,
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Navigate to previous month
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentDate)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    setCurrentDate(prevMonth)
  }

  // Navigate to next month
  const goToNextMonth = () => {
    const nextMonth = new Date(currentDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    setCurrentDate(nextMonth)
  }

  // Go to current month
  const goToCurrentMonth = () => {
    setCurrentDate(new Date())
  }

  // Calculate duration between start and end time
  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    let durationMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
    if (durationMinutes < 0) durationMinutes += 24 * 60

    return durationMinutes
  }

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
  }

  // Get entries for a specific date
  const getEntriesForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return timeEntries.filter((entry) => entry.date === dateString)
  }

  // Calculate total duration for a date
  const getTotalDurationForDate = (date: Date) => {
    const entries = getEntriesForDate(date)
    return entries.reduce((total, entry) => total + entry.duration, 0)
  }

  // Handle adding a new time entry
  const handleAddEntry = async () => {
    if (!selectedDate || !newEntry.project || !newEntry.description || !newEntry.startTime || !newEntry.endTime) {
      return
    }

    const duration = calculateDuration(newEntry.startTime!, newEntry.endTime!)
    if (duration <= 0) return

    const selectedProject = projects.find((p) => p.name === newEntry.project)
    const projectId = selectedProject ? Number(selectedProject.id) : Number(newEntry.project)

    try {
      const created = await createTimeEntry({
        project: projectId,
        description: newEntry.description!,
        start_time: newEntry.startTime!,
        end_time: newEntry.endTime!,
        duration,
        date: selectedDate.toISOString().split("T")[0],
        billable: newEntry.billable || false,
      })
      setTimeEntries([
        {
          id: created.id!,
          project: created.project,
          projectName: selectedProject?.name || String(created.project),
          projectColor: selectedProject?.color || "bg-gray-500",
          description: created.description,
          startTime: created.start_time,
          endTime: created.end_time,
          duration: created.duration,
          date: created.date,
          billable: created.billable,
        },
      ])
      resetForm()
    } catch (e) {
      alert("Failed to add time entry")
    }
  }

  // Reset form
  const resetForm = () => {
    setNewEntry({
      project: "",
      description: "",
      startTime: "09:00",
      endTime: "17:00",
      billable: true,
    })
    setSelectedDate(null)
    setShowAddForm(false)
    setEditingEntryId(null)
  }

  // Handle editing an entry
  const startEditEntry = (entry: TimeEntry) => {
    setEditingEntryId(entry.id)
    setNewEntry({
      project: entry.project,
      description: entry.description,
      startTime: entry.startTime,
      endTime: entry.endTime,
      billable: entry.billable,
    })
    setSelectedDate(new Date(entry.date))
    setShowAddForm(true)
  }

  // Save edited entry
  const saveEditedEntry = async () => {
    if (!editingEntryId) return

    const duration = calculateDuration(newEntry.startTime!, newEntry.endTime!)
    if (duration <= 0) return

    const selectedProject = projects.find((p) => p.name === newEntry.project)
    const projectId = selectedProject ? Number(selectedProject.id) : Number(newEntry.project)

    try {
      const updated = await updateTimeEntry(editingEntryId, {
        project: projectId,
        description: newEntry.description!,
        start_time: newEntry.startTime!,
        end_time: newEntry.endTime!,
        duration,
        date: selectedDate?.toISOString().split("T")[0] || "",
        billable: newEntry.billable || false,
      })
      setTimeEntries(
        timeEntries.map((entry) =>
          entry.id === editingEntryId
            ? {
                id: updated.id!,
                project: updated.project,
                projectName: selectedProject?.name || String(updated.project),
                projectColor: selectedProject?.color || "bg-gray-500",
                description: updated.description,
                startTime: updated.start_time,
                endTime: updated.end_time,
                duration: updated.duration,
                date: updated.date,
                billable: updated.billable,
              }
            : entry
        )
      )
      resetForm()
    } catch (e) {
      alert("Failed to update time entry")
    }
  }

  // Delete an entry
  const deleteEntry = async (id: number) => {
    try {
      await deleteTimeEntry(id)
      setTimeEntries(timeEntries.filter((entry) => entry.id !== id))
    } catch (e) {
      alert("Failed to delete time entry")
    }
  }

  // Show add form for specific date
  const showAddFormForDate = (date: Date) => {
    setSelectedDate(date)
    setShowAddForm(true)
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Navigation */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="h-9 w-9 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrentMonth} className="px-4">
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-9 w-9 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h1>
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time
            </Button>
          </div>
        </div>

        {/* Add Entry Form */}
        {showAddForm && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingEntryId ? "Edit Time Entry" : "Add New Time Entry"}
                {selectedDate && (
                  <span className="text-base font-normal text-gray-600 ml-2">for {formatDate(selectedDate)}</span>
                )}
              </h3>
              <Button variant="ghost" size="sm" onClick={resetForm} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {!selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <Input
                    type="date"
                    value={selectedDate instanceof Date ? selectedDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  />
                </div>
              )}

              <div className={selectedDate ? "md:col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                <Select
                  value={newEntry.project === "" ? "" : String(newEntry.project)}
                  onValueChange={(value) => setNewEntry({ ...newEntry, project: value === "" ? "" : Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${project.color} mr-2`}></div>
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={selectedDate ? "md:col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <Input
                  placeholder="What did you work on?"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start</label>
                <Input
                  type="time"
                  value={newEntry.startTime}
                  onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End</label>
                <Input
                  type="time"
                  value={newEntry.endTime}
                  onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <Button
                variant="ghost"
                className={`flex items-center ${newEntry.billable ? "text-green-600" : "text-gray-400"}`}
                onClick={() => setNewEntry({ ...newEntry, billable: !newEntry.billable })}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                {newEntry.billable ? "Billable" : "Non-billable"}
              </Button>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={editingEntryId ? saveEditedEntry : handleAddEntry}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingEntryId ? "Save Changes" : "Add Entry"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Calendar Header - Days of Week */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="p-4 text-center font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 grid-rows-6 border-b border-gray-200">
            {calendarDays.map((day, index) => {
              const entries = getEntriesForDate(day.date)
              const totalDuration = getTotalDurationForDate(day.date)
              const isCurrentDay = isToday(day.date)

              return (
                <div
                  key={index}
                  className={`group min-h-[120px] border-r border-b border-gray-100 p-2 ${
                    !day.isCurrentMonth ? "bg-gray-50" : isCurrentDay ? "bg-purple-50" : ""
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      <div
                        className={`text-sm font-semibold ${
                          !day.isCurrentMonth ? "text-gray-400" : isCurrentDay ? "text-purple-700" : "text-gray-700"
                        }`}
                      >
                        {day.date.getDate()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-gray-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => showAddFormForDate(day.date)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Time Entries */}
                  <div className="space-y-1">
                    {entries.slice(0, 3).map((entry) => (
                      <div
                        key={entry.id}
                        className={`${entry.projectColor} text-white rounded-md p-1 text-xs cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-between`}
                        onClick={() => startEditEntry(entry)}
                      >
                        <div>
                          <div className="font-medium truncate">{entry.project}</div>
                          <div className="flex items-center justify-between">
                            <span className="truncate">{entry.description}</span>
                            <span>{formatDuration(entry.duration)}</span>
                          </div>
                        </div>
                        <button
                          className="ml-2 text-white hover:text-red-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEntry(entry.id);
                          }}
                          title="Delete entry"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}

                    {entries.length > 3 && (
                      <div className="text-xs text-center text-gray-500 mt-1">+{entries.length - 3} more entries</div>
                    )}

                    {totalDuration > 0 && (
                      <div className="text-xs font-medium text-purple-600 mt-1 text-right">
                        Total: {formatDuration(totalDuration)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-4">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${project.color} mr-2`}></div>
                <span className="text-sm text-gray-700">{project.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
