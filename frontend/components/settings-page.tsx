"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-context"
import {
  User,
  Bell,
  Shield,
  Palette,
  Clock,
  DollarSign,
  Download,
  Trash2,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Key,
  Users,
  Zap,
  Moon,
  Sun,
  Monitor,
  Volume2,
  Wifi,
  Database,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function SettingsPage() {
  const { user, isAuthenticated, logout } = useAuth()
  
  // Profile Settings
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    company: "",
    bio: "",
    location: "",
    website: "",
    timezone: "",
    avatar: "",
  });
  // Store avatar file separately for FormData
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      try {
        const token = localStorage.getItem('authToken')
        console.log("DEBUG: Token from localStorage:", token ? token.substring(0, 20) + "..." : "No token")
        if (!token || !isAuthenticated) {
          setError("No authentication token found")
          setLoading(false)
          return
        }

        console.log("DEBUG: Making request to /api/user-settings/profile/");
        const res = await fetch("/api/user-settings/profile/", {
          headers: {
            'Authorization': `Bearer ${token}`
            // No Content-Type for GET
          }
        });
        console.log("DEBUG: Response status:", res.status);
        if (res.status === 401 || res.status === 403) {
          setError("Authentication failed. Please log in again.");
          setLoading(false);
          logout();
          return;
        }
        if (!res.ok) {
          const errorText = await res.text();
          console.log("DEBUG: Error response:", errorText);
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        console.log("DEBUG: Profile data received:", data);
        setProfileData(data);

      } catch (err) {
        console.error("DEBUG: Error in fetchProfile:", err)
        setError("Could not load profile.")
      } finally {
        setLoading(false)
      }
    }
    
    if (isAuthenticated) {
      fetchProfile()
    } else {
      setLoading(false)
      setError("Please log in to access settings")
    }
  }, [isAuthenticated])

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setError("");
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }
      // Use FormData for avatar + profile fields
      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        // Skip avatar (handled below)
        if (key !== 'avatar') {
          formData.append(key, value ?? '');
        }
      });
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      // If no avatar file, optionally send avatar as empty string (depends on backend)
      // formData.append('avatar', '');
      const res = await fetch("/api/user-settings/profile/", {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${token}`
          // DO NOT set Content-Type; browser will set multipart boundary
        },
        body: formData
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Failed to save profile: " + errorText);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError("Could not save profile. " + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setError("No authentication token found")
        setDeleteLoading(false)
        return
      }

      const res = await fetch("/api/user-settings/delete-account", {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete account")
      }

      // Use the auth context logout function
      await logout()
    } catch (err) {
      if (err instanceof Error) {
        setError(`Could not delete account: ${err.message}`);
      } else {
        setError("Could not delete account: An unknown error occurred.");
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAvatarUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setAvatarFile(file);
        // For preview, show the selected file as a data URL
        const reader = new FileReader();
        reader.onload = (ev) => {
          setProfileData((prev) => ({ ...prev, avatar: ev.target?.result as string }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-white/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-600">Manage your account preferences and application settings</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="text-gray-600">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            {success && <span className="text-green-600 ml-4">Profile saved!</span>}
            {error && <span className="text-red-600 ml-4">{error}</span>}
          </div>
        </div>
      </header>

      {/* Settings Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <Tabs value="profile" className="space-y-6">
            <TabsContent value="profile">
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                  <CardDescription>Update your personal information and profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profileData.avatar || "/placeholder.svg"} alt="Profile" />
                        <AvatarFallback className="text-lg">
                          {profileData.first_name?.[0]}
                          {profileData.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        onClick={handleAvatarUpload}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {profileData.first_name} {profileData.last_name}
                      </h3>
                      <p className="text-gray-600">{profileData.job_title}</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={handleAvatarUpload}>
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={profileData.first_name}
                        onChange={(e) => handleProfileUpdate("first_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profileData.last_name}
                        onChange={(e) => handleProfileUpdate("last_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileUpdate("email", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => handleProfileUpdate("phone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={profileData.job_title}
                        onChange={(e) => handleProfileUpdate("job_title", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) => handleProfileUpdate("company", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) => handleProfileUpdate("location", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={profileData.website}
                        onChange={(e) => handleProfileUpdate("website", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">About Yourself</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => handleProfileUpdate("bio", e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Tell us about yourself, your experience, and interests..."
                    />
                  </div>

                  {/* Timezone */}
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profileData.timezone}
                      onValueChange={(value) => handleProfileUpdate("timezone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Danger Zone */}
                  <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <div className="flex items-center space-x-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h3 className="text-lg font-semibold text-red-800">Danger Zone</h3>
                    </div>
                    <p className="text-red-700 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={deleteLoading}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleteLoading ? "Deleting..." : "Delete Account"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove all your data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
