"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, DollarSign, FileText, Building, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Project } from "@/types/project"


interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (project: Project) => void
  project?: Project | null

}

const PROJECT_TEMPLATES = [
  {
    id: "web-development",
    name: "Web Development",
    description: "Full-stack web application development",
    defaultBillable: true,
    suggestedRate: 75,
  },
  {
    id: "mobile-app",
    name: "Mobile App Development",
    description: "iOS/Android mobile application development",
    defaultBillable: true,
    suggestedRate: 85,
  },
  {
    id: "ui-ux-design",
    name: "UI/UX Design",
    description: "User interface and experience design",
    defaultBillable: true,
    suggestedRate: 65,
  },
  {
    id: "consulting",
    name: "Consulting",
    description: "Strategic consulting and advisory services",
    defaultBillable: true,
    suggestedRate: 150,
  },
  {
    id: "marketing",
    name: "Marketing Campaign",
    description: "Digital marketing and campaign management",
    defaultBillable: true,
    suggestedRate: 55,
  },
  {
    id: "content-creation",
    name: "Content Creation",
    description: "Content writing, blogging, and copywriting",
    defaultBillable: true,
    suggestedRate: 45,
  },
  {
    id: "data-analysis",
    name: "Data Analysis",
    description: "Data analysis and business intelligence",
    defaultBillable: true,
    suggestedRate: 95,
  },
  {
    id: "internal-project",
    name: "Internal Project",
    description: "Internal company project or initiative",
    defaultBillable: false,
    suggestedRate: 0,
  },
  {
    id: "research",
    name: "Research & Development",
    description: "Research and development activities",
    defaultBillable: false,
    suggestedRate: 0,
  },
  {
    id: "maintenance",
    name: "Maintenance & Support",
    description: "Ongoing maintenance and technical support",
    defaultBillable: true,
    suggestedRate: 65,
  },
]

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  project,

}: ProjectModalProps) {
  type ProjectFormData = {
    name: string;
    client: string;
    description: string;
    template: string;
    deadline: string;
    isBillable: boolean;
    billableRate: string;

    status: string;
    progress: string;
    totalHours: string;
  };

  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || "",
    client: project?.client || "",
    description: project?.description || "",
    template: project?.template
      ? PROJECT_TEMPLATES.find((t) => t.name === project.template)?.id || ""
      : "",
    deadline: project?.deadline || "",
    isBillable: project?.isBillable ?? true,
    billableRate: project?.billableRate?.toString() || "",
    status: project?.status || "Planning",
    progress: project?.progress?.toString() || "0",
    totalHours: project?.totalHours?.toString() || "0",
  })


  const [projectNameSuggestions, setProjectNameSuggestions] = useState<string[]>([])
  const [clientNameSuggestions, setClientNameSuggestions] = useState<string[]>([])


  // Reset form when modal opens/closes or project changes
  useEffect(() => {
    // Only reset form if editing an existing project, not when creating new
    if (isOpen && project) {
      const newFormData = {
        name: project?.name || "",
        client: project?.client || "",
        description: project?.description || "",
        template: project?.template
          ? PROJECT_TEMPLATES.find((t) => t.name === project.template)?.id || ""
          : "",
        deadline: project?.deadline || "",
        isBillable: project?.isBillable ?? true,
        billableRate: project?.billableRate?.toString() || "",

        status: project?.status || "Planning",
        progress: project?.progress?.toString() || "0",
        totalHours: project?.totalHours?.toString() || "0",
      };
      setFormData((prev) => {
        const isSame = (Object.keys(newFormData) as Array<keyof ProjectFormData>).every(
          (key: keyof ProjectFormData) => prev[key] === newFormData[key]
        );
        return isSame ? prev : newFormData;
      });
    }
  }, [isOpen, project]);

  // Extract unique project and client names from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      // Get clients from projects
      const savedProjects = localStorage.getItem('userProjects');
      let projectClients: string[] = [];
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        projectClients = projects.map((p: any) => p.client).filter(Boolean);
      }

      // Get clients from clients list
      const savedClients = localStorage.getItem('clients');
      let clientList: string[] = [];
      if (savedClients) {
        const clients = JSON.parse(savedClients);
        clientList = clients.map((c: any) => c.name).filter(Boolean);
      }

      // Merge and deduplicate
      setClientNameSuggestions(Array.from(new Set([...projectClients, ...clientList])));
    }
  }, [isOpen])



  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTemplateChange = (templateId: string) => {
    setFormData((prev) => {
      if (prev.template === templateId) return prev;
      const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
      if (!template) {
        return prev;
      }
      // Only update if something actually changes
      const newFormData = {
        ...prev,
        template: template.id,
        isBillable: template.defaultBillable,
        billableRate: template.suggestedRate.toString(),
        description: prev.description || template.description,
      };
      const isSame = (Object.keys(newFormData) as Array<keyof ProjectFormData>).every(
        (key: keyof ProjectFormData) => prev[key] === newFormData[key]
      );
      return isSame ? prev : newFormData;
    });
  }







  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const projectData = {
      ...formData,
      billableRate: formData.isBillable ? Number.parseFloat(formData.billableRate) || 0 : 0,
      progress: Number.parseInt(formData.progress) || 0,
      totalHours: Number.parseFloat(formData.totalHours) || 0,
      id: project?.id ?? Date.now(), // add id for both edit and create
    }

    onSave(projectData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{project ? "Edit Project" : "Create New Project"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Project Template */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-2" />
                Project Template
              </Label>
              <Select value={formData.template} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a project template" />
                </SelectTrigger>
                <SelectContent className="z-[60] max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-lg">
                  {PROJECT_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id} className="cursor-pointer hover:bg-gray-100 p-2">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{template.name}</span>
                        <span className="text-xs text-gray-500">{template.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Name */}
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full"
                placeholder="Enter project name"
                required
                list="project-name-suggestions"
              />
              <datalist id="project-name-suggestions">
                {projectNameSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Client */}
            <div>
              <Label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-2" />
                Client *
              </Label>
              <Input
                id="client"
                type="text"
                value={formData.client}
                onChange={(e) => handleInputChange("client", e.target.value)}
                className="w-full"
                placeholder="Enter client name"
                required
                list="client-name-suggestions"
              />
              <datalist id="client-name-suggestions">
                {clientNameSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full min-h-[100px]"
                placeholder="Describe the project goals and requirements"
              />
            </div>

            {/* Billing Settings */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Billing Settings
              </h3>

              {/* Billable Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Billable Project</Label>
                  <p className="text-xs text-gray-500">Enable billing and hourly rates for this project</p>
                </div>
                <Switch
                  checked={formData.isBillable}
                  onCheckedChange={(checked) => handleInputChange("isBillable", checked)}
                />
              </div>

              {/* Billable Rate */}
              {formData.isBillable && (
                <div>
                  <Label htmlFor="billableRate" className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (USD)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="billableRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.billableRate}
                      onChange={(e) => handleInputChange("billableRate", e.target.value)}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>



            {/* Project Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deadline */}
              <div>
                <Label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Deadline
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange("deadline", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Initial Hours (for editing) */}
              {project && (
                <div>
                  <Label htmlFor="totalHours" className="block text-sm font-medium text-gray-700 mb-2">
                    Total Hours Logged
                  </Label>
                  <Input
                    id="totalHours"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.totalHours}
                    onChange={(e) => handleInputChange("totalHours", e.target.value)}
                    className="w-full"
                    placeholder="0.0"
                  />
                </div>
              )}
            </div>

            {/* Status and Progress (for editing) */}
            {project && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60] bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="Planning" className="cursor-pointer hover:bg-gray-100 p-2">
                        <span className="text-gray-900">Planning</span>
                      </SelectItem>
                      <SelectItem value="In Progress" className="cursor-pointer hover:bg-gray-100 p-2">
                        <span className="text-gray-900">In Progress</span>
                      </SelectItem>
                      <SelectItem value="Review" className="cursor-pointer hover:bg-gray-100 p-2">
                        <span className="text-gray-900">Review</span>
                      </SelectItem>
                      <SelectItem value="On Hold" className="cursor-pointer hover:bg-gray-100 p-2">
                        <span className="text-gray-900">On Hold</span>
                      </SelectItem>
                      <SelectItem value="Completed" className="cursor-pointer hover:bg-gray-100 p-2">
                        <span className="text-gray-900">Completed</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-2">
                    Progress (%)
                  </Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress}
                    onChange={(e) => handleInputChange("progress", e.target.value)}
                    className="w-full"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button type="button" variant="outline" onClick={onClose} className="text-gray-600 hover:text-gray-800">
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
              {project ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
