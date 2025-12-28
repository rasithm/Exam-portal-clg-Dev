// src/pages/AdminProfile.tsx
import { useState , useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Lock,
  ArrowLeft,
  Edit,
  Save,
  Eye,
  EyeOff,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { baseUrl } from "../constant/Url";
const API_BASE = baseUrl || "http://localhost:5000";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;

const AdminProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userType] = useState<"admin" | "student">("student");
  const [profileImagePreview, setProfileImagePreview] = useState<string>(""); // preview URL / base64 for UI
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null); // actual File to upload
  const [originalEmail, setOriginalEmail] = useState("");
  
  const [profileData, setProfileData] = useState<any>({
    name: "",
    email: "",
    phone_no: "", // use phone_no naming
    whatsapp_no:"",
    department: "",
    joinDate: "",
    studentId: userType === "student" ? "CS2024001" : undefined,
    registerNo: userType === "student" ? "REG2024CS001" : undefined,
    role: userType === "admin" ? "Administrator" : "Administrator",
    personalemail : "", 
    
    collegeName: userType === "student" ? "AJCE" : "",
    collageTag : "",
    
    
  });

  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });


  // --- fetch profile once ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/admin/profile`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();

        setProfileData(prev => ({
          ...prev,
          name: data.name || "",
          email: data.email || prev.email,
          personalemail : data.personalemail || "",
          phone_no: data.phone_no || "",
          whatsapp_no: data.whatsapp_no || "",
          department: data.department || prev.department,
          adminId : data._id?.slice(-8) || prev._id?.slice(-8),
          
          
          
          role: data.role || prev.role,
          
          
          
          collegeName: data.collegeName || prev.collegeName,
          
          collegeTag: data.collegeTag || prev.collegeTag,
          // year: data.year || prev.year,
          // github : data.github || prev.github,
          // leetcode : data.leetcode || prev.leetcode
        }));

        if (data.profileImage) {
          setProfileImagePreview(data.profileImage);
        }
        setOriginalEmail(data.personalEmail || "");

        const adminId = profileData._id?.slice(-8);
      } catch (err) {
        console.error("Profile fetch error:", err);
        toast({
          title: "Unable to load profile",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  // --- image input (preview + save File object) ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);

    // preview
    const reader = new FileReader();
    reader.onloadend = () => setProfileImagePreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  // --- profile update ---
  // const handleProfileUpdate = async (e: React.FormEvent) => {
  //   e.preventDefault();

    
  //   if (!profileData.name?.trim() || !profileData.personalemail?.trim()) {
  //     toast({ title: "Validation", description: "Name, email and date of birth are required", variant: "destructive" });
  //     return;
  //   }
  //   if (!emailRegex.test(profileData.personalemail)) {
  //     toast({ title: "Validation", description: "Invalid email format", variant: "destructive" });
  //     return;
  //   }
    
  //   if (!phoneRegex.test(String(profileData.phone_no))) {
  //     toast({ title: "Validation", description: "Phone number must be 10 digits", variant: "destructive" });
  //     return;
  //   }

  //   try {
  //     const formData = new FormData();
  //     formData.append("name", profileData.name);
  //     formData.append("personalemail", profileData.personalemail);
  //     formData.append("phone_no", String(profileData.phone_no));
  //     formData.append("whatsapp_no", String(profileData.whatsapp_no || ""));
      
  //     formData.append("collegeName", profileData.collegeName || "");
  //     formData.append("collegeTag", profileData.collegeTag || "");
      
  //     formData.append("department", profileData.department || "");
  //     formData.append("email", profileData.email || "");
  //     if (profileImageFile) formData.append("profileImage", profileImageFile);

  //     const res = await fetch(`${API_BASE}/api/admin/profile`, {
  //       method: "PUT",
  //       body: formData,
  //       credentials: "include",
  //     });

  //     const resJson = await res.json();
  //     if (!res.ok) {
  //       throw new Error(resJson.message || "Update failed");
  //     }

  //     toast({ title: "Profile Updated", description: resJson.message || "Saved" });
  //     setIsEditing(false);
      
  //     if (resJson.student) {
  //       setProfileData((p: any) => ({ ...p, ...resJson.student }));
  //       if (resJson.student.profileImage) setProfileImagePreview(resJson.student.profileImage);
  //     }
  //   } catch (err: any) {
  //     console.error("Update error:", err);
  //     toast({ title: "Error", description: err.message || "Failed to update", variant: "destructive" });
  //   }
  // };
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailChanged = profileData.personalemail.trim().toLowerCase() !== originalEmail.trim().toLowerCase();
    console.log(originalEmail)
    console.log(profileData.personalemail)
    console.log(emailChanged)

    try {
      if (emailChanged) {
        const res = await fetch(`${API_BASE}/api/admin/verify-email/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ personalEmail: profileData.personalemail }),
        });
        const json = await res.json(); 

        
        sessionStorage.setItem("pendingAdminProfileUpdate", JSON.stringify({
          ...profileData,
          requestId: json.requestId
        }));

        navigate(`/reset/verify?role=admin&req=${json.requestId}`);
        return;
      }

      await submitProfileUpdate(profileData);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };
  const submitProfileUpdate = async (data: any) => {
    const pending = sessionStorage.getItem("pendingAdminProfileUpdate");
    if (pending) {
      const data = JSON.parse(pending);
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("phone_no", data.phone_no);
      formData.append("whatsapp_no", data.whatsapp_no || "");
      formData.append("personalEmail" , data.personalemail || "")

      if(data.profileImageFile) formData.append("profileImage" , data.profileImageFile)

      const res = await fetch(`${API_BASE}/api/admin/profile`, {
        method: "PUT",
        credentials: "include",
        body: formData
      });

      sessionStorage.removeItem("pendingAdminProfileUpdate");
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      toast({ title: "Profile Updated" });
    }


    
    
  };



  // --- password change ---
  

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return false;
    if (!/[a-z]/.test(password)) return false;    // lowercase
    if (!/[0-9]/.test(password)) return false;  // number
    if(!/[A-Z]/.test(password)) return false;  //capitalcase  
    return true;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    // Required validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast({
        title: "Missing Fields",
        description: "All password fields are required.",
        variant: "destructive",
      });
    }

    if (!validatePassword(newPassword)) {
      return toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long, include one lowercase letter and one number.",
        variant: "destructive",
      });
    }

    if (newPassword !== confirmPassword) {
      return toast({
        title: "Mismatch",
        description: "New password & confirm password do not match.",
        variant: "destructive",
      });
    }

    if (showPasswords.confirm === true || showPasswords.current === true || showPasswords.new === true) {
      toast({
        title: "Security Alert",
        description: "Hide your password before logging in",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/profile/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Password update failed.");
      }

      toast({
        title: "Success",
        description: "Password updated successfully!",
      });

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Unable to update password",
        variant: "destructive",
      });
    }
  };

  





  if (loading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card shadow-card border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center  ">
            <div className="flex items-center justify-start gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/dashboard")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="ml-11">
                <h1 className="text-2xl font-bold text-card-foreground">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your account information and preferences</p>
              </div>
            </div>
            <Badge variant="secondary" className="capitalize">{profileData.role}</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 max-w-2xl">
            <Card className="shadow-card">
              <CardContent className="p-6 text-center">
                <div className="relative mx-auto mb-4 w-32 h-32">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-primary-light" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary-light flex items-center justify-center border-4 border-primary-light">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                  )}
                  {isEditing && (
                    <label htmlFor="profile-image" className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4 text-white" />
                      <input id="profile-image" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2 capitalize">{profileData.name}</h3>
                <p className="text-muted-foreground mb-4">{profileData.role}</p>
                <Badge variant="outline" className="mb-2">ID: {profileData.adminId}</Badge>
                {/* {profileData.registerNo && <Badge variant="outline" className="mb-4 block w-fit mx-auto">Reg: {profileData.registerNo}</Badge>} */}
              </CardContent>
            </Card>
          </div>

          {/* Main */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="personal" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Personal Information</TabsTrigger>
                <TabsTrigger value="security">Security Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your details</CardDescription>
                      </div>
                      <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? <>Cancel</> : <><Edit className="h-4 w-4 mr-2" /> Edit Profile</>}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" value={profileData.name} onChange={(e) => setProfileData(p => ({ ...p, name: e.target.value }))} disabled={!isEditing} />
                        </div>

                        {/* <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input id="dateOfBirth" type="date" value={profileData.dateOfBirth} onChange={(e) => setProfileData(p => ({ ...p, dateOfBirth: e.target.value }))} disabled={!isEditing} />
                        </div> */}

                        <div className="space-y-2">
                          <Label htmlFor="email">Personal Email Address</Label>
                          <Input id="email" type="email" value={profileData.personalemail} onChange={(e) => setProfileData(p => ({ ...p, personalemail: e.target.value }))} disabled={!isEditing} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Admin Phone Number</Label>
                          <Input id="phone" value={profileData.phone_no} onChange={(e) => setProfileData(p => ({ ...p, phone_no: e.target.value }))} disabled={!isEditing} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="whatsappNumber">Admin WhatsApp Number</Label>
                          <Input id="whatsappNumber" value={profileData.whatsapp_no} onChange={(e) => setProfileData(p => ({ ...p, whatsapp_no: e.target.value }))} disabled={!isEditing} />
                        </div>

                        
                        {profileData.collegeName && (
                          <div className="space-y-2">
                            <Label htmlFor="studentId">Collage Name</Label>
                            <Input id="studentId" value={profileData.collegeName} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Collage Name cannot be modified</p>
                          </div>
                        )}

                        
                        {profileData.collegeTag && (
                          <div className="space-y-2">
                            <Label htmlFor="studentId">Collage ID</Label>
                            <Input id="studentId" value={profileData.collegeTag} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Collage ID cannot be modified</p>
                          </div>
                        )}

                        {/* <div className="space-y-2">
                          <Label htmlFor="year">Year of Study</Label>
                          <Input id="year" value={profileData.year} onChange={(e) => setProfileData(p => ({ ...p, year: e.target.value }))} disabled={!isEditing} />
                        </div> */}

                        
                        {profileData.department && (
                          <div className="space-y-2">
                            <Label htmlFor="studentId">Department</Label>
                            <Input id="studentId" value={profileData.department} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Admin Department cannot be modified</p>
                          </div>
                        )}

                        {/* <div className="space-y-2">
                          <Label htmlFor="github">GitHub</Label>
                          <Input id="github" value={profileData.github} onChange={(e) => setProfileData(p => ({ ...p, github: e.target.value }))} disabled={!isEditing} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="leetcode">LeetCode</Label>
                          <Input id="leetcode" value={profileData.leetcode} onChange={(e) => setProfileData(p => ({ ...p, leetcode: e.target.value }))} disabled={!isEditing} />
                        </div> */}

                        {profileData.studentId && (
                          <div className="space-y-2">
                            <Label htmlFor="studentId">Email</Label>
                            <Input id="studentId" value={profileData.email} disabled className="bg-muted" />
                            <p className="text-xs text-muted-foreground">Admin Email cannot be modified</p>
                          </div>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex gap-3">
                          <Button type="submit" variant="hero"><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
                          <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Update your password</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      {/* Current Password */}
                      <div className="space-y-2">
                        <Label htmlFor="current-pass">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="current-pass"
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                            onClick={() => togglePasswordVisibility("current")}
                          >
                            {showPasswords.current ? <EyeOff /> : <Eye />}
                          </Button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="new-pass">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-pass"
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData((p) => ({ ...p, newPassword: e.target.value }))
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                            onClick={() => togglePasswordVisibility("new")}
                          >
                            {showPasswords.new ? <EyeOff /> : <Eye />}
                          </Button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="confirm-pass">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm-pass"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                            onClick={() => togglePasswordVisibility("confirm")}
                          >
                            {showPasswords.confirm ? <EyeOff /> : <Eye />}
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded">
                        <h4 className="font-medium mb-2">Password Requirements:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• At least 8 characters long</li>
                          <li>• Include at least one number</li>
                          <li>• Include at least one lowercase letter</li>
                        </ul>
                      </div>

                      <Button type="submit" variant="hero">
                        <Lock className="h-4 w-4 mr-2" /> Update Password
                      </Button>
                    </form>

                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
