import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { RefreshCcw } from "lucide-react";
import { baseUrl } from "../constant/Url";
import io from "socket.io-client";

const socket = io(baseUrl, { withCredentials: true });

const NotificationPopup = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications when popup opens
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/admin/notifications`, { credentials: "include" });
      const data = await res.json();
      setNotifications(data.files || []);
    } catch (error) {
      toast({ title: "Failed to load notifications", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // ✅ Listen for new notifications via socket.io
  useEffect(() => {
    socket.on("newNotification", (newData) => {
      toast({
        title: "📩 New File Uploaded",
        description: `File: ${newData.fileName} (${newData.category})`,
      });
      setNotifications((prev) => [newData, ...prev]);
    });

    return () => {
      socket.off("newNotification");
    };
  }, []);

  const handleAccept = async (id: string, email: string) => {
    const res = await fetch(`${baseUrl}/api/admin/notifications/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adminEmail: email }),
      credentials: "include",
    });
    if (res.ok) {
      toast({ title: "✅ File accepted successfully" });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    }
  };

  const handleReject = async (id: string) => {
    const res = await fetch(`${baseUrl}/api/admin/notifications/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      credentials: "include",
    });
    if (res.ok) {
      toast({ title: "❌ File rejected" });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    }
  };

  const handleRefresh = async () => {
    await fetchNotifications();
    toast({
      title: "🔁 Refreshed",
      description: "Notification list updated",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pending Question Files</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-6">
          <Button
            variant="outline"
            className="flex-1 flex items-center gap-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">No new notifications.</p>
          )}

          {notifications.map((n) => (
            <div key={n._id} className="p-3 border rounded-lg">
              <p><b>File:</b> {n.fileName}</p>
              <p><b>Category:</b> {n.category}</p>
              <p><b>Subcategory:</b> {n.subCategory}</p>
              <p><b>Uploader:</b> {n.uploaderEmail}</p>
              <p><b>Questions:</b> {n.questionCount}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => handleAccept(n._id, n.uploaderEmail)}>
                  Accept
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleReject(n._id)}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPopup;

