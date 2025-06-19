"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  User,
  Building,
  FileText,
  Eye,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  CheckCircle,
  RotateCcw,
  FolderOpen,
  Users,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProjectModal as EnhancedProjectModal } from "./enhanced-project-modal"
import { Project } from "@/types/project";
import { Textarea } from "@/components/ui/textarea"
import { fetchProjects, createProject, updateProject } from "@/utils/projects-api"

// Add this function for backend delete
async function deleteProjectFromBackend(projectId: number) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api"}/projects/${projectId}/`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete project in backend");
}

// Add this function for backend create
async function createProjectInBackend(projectData: any) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api"}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  })
  if (!response.ok) throw new Error("Failed to create project in backend")
  return await response.json()
}

export function ProjectsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  interface Filters {
  client: string;
  billable: string;
  template: string;
}

const [filters, setFilters] = useState<Filters>({
  client: "",
  billable: "",
  template: "",
})

  // State to store user-created projects
  const [projects, setProjects] = useState<Project[]>([]) // Always fetch from backend, never localStorage
  const [showTaskCreation, setShowTaskCreation] = useState(false)
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<string>("")

  // New states for API integration
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectClient, setNewProjectClient] = useState("")

  // Dynamic data based on created projects
  const clients = [
    "All Clients",
    ...Array.from(new Set(projects.map((p) => p.client))).filter((c) => c && c !== ""),
  ];
  
  const billableOptions = ["All", "Billable", "Non-Billable"];
  const templates = [
    "All Templates",
    "Web Development",
    "Mobile App",
    "Design",
    "Internal Project",
    "Consulting",
    "Marketing",
    "Research",
    ...Array.from(
      new Set(
        projects
          .map((p) => p.template)
          .filter(
            (t) =>
              t &&
              ![
                "Web Development",
                "Mobile App",
                "Design",
                "Internal Project",
                "Consulting",
                "Marketing",
                "Research",
              ].includes(t)
          )
      )
    ).filter((t) => t && t !== ""),
  ];

  useEffect(() => {
    const selectedProject = localStorage.getItem("selectedProject")
    if (selectedProject) {
      setSelectedProjectForTasks(selectedProject)
      setShowTaskCreation(true)
      localStorage.removeItem("selectedProject")
    }
  }, [])

  // Fetch projects from API
  useEffect(() => {
    setLoading(true)
    fetchProjects()
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(
            data.map((p) => ({
              ...p,
              recentActivity: Array.isArray(p.recentActivity) ? p.recentActivity : [],
              name: p.name ?? "",
              client: p.client ?? "",
              description: p.description ?? "",
              status: p.status ?? "Planning",
              progress: typeof p.progress === "number" ? p.progress : 0,
              billableRate: typeof p.billableRate === "number" ? p.billableRate : 0,
              totalHours: typeof p.totalHours === "number" ? p.totalHours : 0,
              billableHours: typeof p.billableHours === "number" ? p.billableHours : 0,
              totalCost: typeof p.totalCost === "number" ? p.totalCost : 0,
              template: p.template ?? "",
              createdDate: p.createdDate ?? new Date().toISOString().split("T")[0],
              deadline: p.deadline ?? "",
              isBillable: typeof p.isBillable === "boolean" ? p.isBillable : false,
            }))
          )
        } else {
          setProjects([])
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [loading])

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const backendProject = await createProjectInBackend({
        name: newProjectName,
        client: newProjectClient,
        // Add other fields as needed for your backend serializer
      })
      setNewProjectName("")
      setNewProjectClient("")
      setLoading(true) // trigger refetch from backend
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Planning":
        return "bg-yellow-100 text-yellow-800"
      case "On Hold":
        return "bg-orange-100 text-orange-800"
      case "Review":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return CheckCircle
      case "In Progress":
        return Play
      case "Planning":
        return FileText
      case "On Hold":
        return Pause
      case "Review":
        return RotateCcw
      default:
        return FileText
    }
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      Planning: "In Progress",
      "In Progress": "Review",
      Review: "Completed",
      "On Hold": "In Progress",
      Completed: "Planning", // Allow restarting if needed
    }
    return statusFlow[currentStatus as keyof typeof statusFlow] || "In Progress"
  }

  const getStatusProgress = (status: string) => {
    const progressMap = {
      Planning: 0,
      "In Progress": 50,
      Review: 85,
      "On Hold": 25,
      Completed: 100,
    }
    return progressMap[status as keyof typeof progressMap] || 0
  }

  const isDeadlineOverdue = (deadline: string) => {
    if (!deadline) return false
    const deadlineDate = new Date(deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    deadlineDate.setHours(0, 0, 0, 0)
    return deadlineDate < today
  }

  const isDeadlineNear = (deadline: string) => {
    if (!deadline) return false
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      (project.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (project.client?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesClient = !filters.client || filters.client === "All Clients" || project.client === filters.client;

    const matchesBillable =
      !filters.billable ||
      filters.billable === "All" ||
      (filters.billable === "Billable" && project.isBillable) ||
      (filters.billable === "Non-Billable" && !project.isBillable);
    const matchesTemplate =
      !filters.template || filters.template === "All Templates" || project.template === filters.template;

    return matchesSearch && matchesClient && matchesBillable && matchesTemplate;
  })

  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setShowAddModal(true)
  }

  const [statusLoading, setStatusLoading] = useState<{[key:number]: boolean}>({});
const [statusError, setStatusError] = useState<{[key:number]: string | null}>({});

const handleStatusChange = async (projectId: number, newStatus: string) => {
  setStatusLoading((prev) => ({ ...prev, [projectId]: true }));
  setStatusError((prev) => ({ ...prev, [projectId]: null }));
  try {
    // Persist to backend
    await updateProject(projectId, {
      status: newStatus,
      progress: getStatusProgress(newStatus),
    });
    // Update local state
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id === projectId) {
          const updatedProject = {
            ...project,
            status: newStatus,
            progress: getStatusProgress(newStatus),
          };
          if (!updatedProject.recentActivity) updatedProject.recentActivity = [];
          updatedProject.recentActivity.unshift({
            action: `Changed status to ${newStatus}`,
            user: "You",
            time: "Just now",
          });
          return updatedProject;
        }
        return project;
      })
    );
  } catch (err: any) {
    setStatusError((prev) => ({ ...prev, [projectId]: err.message || "Failed to update status" }));
  } finally {
    setStatusLoading((prev) => ({ ...prev, [projectId]: false }));
  }
}

  const handleSaveProject = async (projectData: any) => {
    if (selectedProject) {
      // Optionally: implement backend update (PUT/PATCH) here for editing
      // After update, trigger refetch
      setLoading(true)
    } else {
      try {
        await createProjectInBackend({
          name: projectData.name,
          client: projectData.client,
          // Add other fields as needed
        })
        setLoading(true) // trigger refetch from backend
      } catch (err) {
        // Optionally show error to user
        setLoading(false)
      }
    }
    setSelectedProject(null)
  }

  const handleDeleteProject = async (projectId: number) => {
    setLoading(true);
    try {
      await deleteProjectFromBackend(projectId);
      // Wait for backend to process, then trigger a refetch by toggling loading state
      fetchProjects()
        .then((data) => {
          if (Array.isArray(data)) {
            setProjects(
              data.map((p) => ({
                ...p,
                
                recentActivity: Array.isArray(p.recentActivity) ? p.recentActivity : [],
                name: p.name ?? "",
                client: p.client ?? "",
                description: p.description ?? "",
                status: p.status ?? "Planning",
                progress: typeof p.progress === "number" ? p.progress : 0,
                billableRate: typeof p.billableRate === "number" ? p.billableRate : 0,
                totalHours: typeof p.totalHours === "number" ? p.totalHours : 0,
                billableHours: typeof p.billableHours === "number" ? p.billableHours : 0,
                totalCost: typeof p.totalCost === "number" ? p.totalCost : 0,
                template: p.template ?? "",
                createdDate: p.createdDate ?? new Date().toISOString().split("T")[0],
                deadline: p.deadline ?? "",
                isBillable: typeof p.isBillable === "boolean" ? p.isBillable : false,
              }))
            );
          } else {
            setProjects([]);
          }
        })
        .catch(() => setProjects([]));
    } catch (err) {
      setError("Failed to delete project.");
    } finally {
      setLoading(false);
    }
  }

  const renderTaskCreationInterface = () => {
    if (projects.length === 0 && showTaskCreation) {
      return (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Create Tasks</CardTitle>
            <CardDescription>You can create tasks even without setting up projects first</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input placeholder="Enter task name" className="w-full" />
              <Textarea placeholder="Task description" className="w-full" />
              <div className="flex space-x-2">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">Create Task</Button>
                <Button variant="outline" onClick={() => setShowTaskCreation(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }
    return null
  }

  return (
    <>
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
            <p className="text-gray-600">
              {projects.length === 0
                ? "Create and manage your projects with time tracking and billing"
                : `Managing ${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      {/* Filters and Search */}
      {projects.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-white/20 px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select
                value={filters.client ?? ""}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, client: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <Building className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client} value={client}>
  {client}
</SelectItem>
                  ))}
                </SelectContent>
              </Select>


              <Select
                value={filters.billable ?? ""}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, billable: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Billable" />
                </SelectTrigger>
                <SelectContent>
                  {billableOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.template ?? ""}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, template: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template} value={template}>
  {template}
</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Projects Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const StatusIcon = getStatusIcon(project.status ?? "Unknown")
              const nextStatus = getNextStatus(project.status ?? "Unknown")
              const overdue = isDeadlineOverdue(project.deadline ?? "");
              const near = isDeadlineNear(project.deadline ?? "");

              return (
                <Card key={project.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    {/* Deadline Warning */}
                    {(overdue || near) && project.status !== "Completed" && (
                        <div
                          className={`flex items-center space-x-2 p-2 rounded-lg mb-3 ${
                            overdue
                              ? "bg-red-50 border border-red-200"
                              : "bg-orange-50 border border-orange-200"
                          }`}
                        >
                          <AlertTriangle
                            className={`h-4 w-4 ${
                              overdue ? "text-red-500" : "text-orange-500"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              overdue ? "text-red-700" : "text-orange-700"
                            }`}
                          >
                            {overdue
                              ? "⚠️ Deadline overdue! Complete ASAP"
                              : "⏰ Deadline approaching soon"}
                          </span>
                        </div>
                      )}

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-800 mb-1">{(project.name ?? "Unnamed Project").toString()}</CardTitle>
                        <CardDescription className="text-sm text-gray-600">{(project.description ?? "No description").toString()}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProject(project)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProject(project.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(project.status ?? "Unknown")}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {project.status ?? "Unknown"}
                        </Badge>
                        {project.status !== "Completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(Number(project.id), nextStatus)}
                            className="h-6 px-2 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                          >
                            → {nextStatus}
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>{(project.client ?? "No client").toString()}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress ?? 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress ?? 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Total Hours</span>
                        </div>
                        <div className="font-semibold">{project.totalHours ?? 0}h</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>Total Cost</span>
                        </div>
                        <div className="font-semibold">
                          {project.isBillable ? `$${(Number(project.totalCost ?? 0)).toLocaleString()}` : "Non-billable"}
                        </div>
                      </div>
                    </div>

                    {/* Billable Rate */}
                    {project.isBillable && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Billable Rate</span>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-green-600 mt-1">${Number(project.billableRate ?? 0)}/hour</div>
                        <div className="text-xs text-green-600 mt-1">
                          {project.billableHours ?? 0}h billable • $
                          {((Number(project.billableHours ?? 0)) * (Number(project.billableRate ?? 0))).toLocaleString()} earned
                        </div>
                      </div>
                    )}

                    {/* Team Members */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Team Members</div>
                      {Array.isArray(project.members) && project.members.length > 0 ? (
                        <div className="flex -space-x-2">
                          {project.members.slice(0, 3).map((member, index) => {
                            // Professional color palette for avatars
                            const colors = [
                              "bg-gradient-to-br from-purple-500 to-purple-600 text-white",
                              "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
                              "bg-gradient-to-br from-green-500 to-green-600 text-white",
                              "bg-gradient-to-br from-orange-500 to-orange-600 text-white",
                              "bg-gradient-to-br from-pink-500 to-pink-600 text-white",
                              "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white",
                              "bg-gradient-to-br from-teal-500 to-teal-600 text-white",
                              "bg-gradient-to-br from-red-500 to-red-600 text-white",
                            ]
                            const colorClass = colors[index % colors.length]

                            return (
                              <div
                                key={member.id}
                                className={`h-8 w-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${colorClass}`}
                                title={member.name}
                              >
                                <span className="text-xs font-semibold">
                                  {member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </span>
                              </div>
                            )
                          })}
                          {project.members.length > 3 && (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 border-2 border-white flex items-center justify-center shadow-sm">
                              <span className="text-xs text-white font-semibold">+{project.members.length - 3}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">No members</div>
                      )}
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Recent Activity</div>
                      {Array.isArray(project.recentActivity) && project.recentActivity.length > 0 ? (
                        <div className="space-y-1">
                          {project.recentActivity.slice(0, 2).map((activity, index) => (
                            <div key={index} className="text-xs text-gray-500">
                              <span className="font-medium">{activity.user}</span> {activity.action}
                              <span className="text-gray-400 ml-1">• {activity.time}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">No recent activity</div>
                      )}
                    </div>

                    {/* Project Info */}
                    <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>Created: {project.createdDate ? new Date(project.createdDate).toLocaleDateString() : "Unknown"}</span>
                      {project.deadline && (
                        <span
                          className={
                            isDeadlineOverdue(project.deadline) && project.status !== "Completed"
                              ? "text-red-600 font-medium"
                              : (isDeadlineNear(project.deadline) && project.status !== "Completed"
                                ? "text-orange-600 font-medium"
                                : "")
                          }
                        >
                          Due: {project.deadline ? new Date(project.deadline).toLocaleDateString() : "No deadline"}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Empty State */}
          {projects.length === 0 ? (
            // No projects exist at all
            <div className="text-center py-20">
              <div className="mb-8">
                <div className="inline-block relative">
                  <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
                    <circle cx="60" cy="60" r="50" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2" />
                    <circle cx="60" cy="60" r="40" fill="#ffffff" stroke="#a855f7" strokeWidth="2" />
                    <FolderOpen className="h-12 w-12 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Projects!</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start organizing your work by creating your first project. Track time, manage team members, set billing
                rates, and monitor progress all in one place.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <span>Track Time</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span>Manage Team</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-purple-500" />
                    <span>Set Billing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <span>Track Progress</span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </div>
          ) : filteredProjects.length === 0 ? (
            // Projects exist but none match filters
            <div className="text-center py-16">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or filters to find the projects you're looking for
              </p>
              <div className="space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setFilters({ client: "", billable: "", template: "" })
                  }}
                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                >
                  Clear Filters
                </Button>
                <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Project
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Project Modal */}
      <EnhancedProjectModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setSelectedProject(null)
        }}
        onSave={handleSaveProject}
        project={selectedProject}
      />
    </>
  )
}
