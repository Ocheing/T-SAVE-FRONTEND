import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Bell, Globe, Lock, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
    const handleSave = () => {
        toast.success("Settings updated successfully (Simulated)");
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
                <p className="text-muted-foreground mt-1">Configure platform-wide preferences and security.</p>
            </div>

            <div className="grid gap-8">
                <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Role Management</CardTitle>
                                <CardDescription>Configure admin roles and access levels.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base">MFA for Admins</Label>
                                <p className="text-sm text-muted-foreground">Require Multi-Factor Authentication for all administrative accounts.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base">IP Whitelisting</Label>
                                <p className="text-sm text-muted-foreground">Restrict dashboard access to specific IP ranges.</p>
                            </div>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Bell className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <CardTitle>Global Notifications</CardTitle>
                                <CardDescription>Manage how system alerts are sent to users.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid gap-2">
                            <Label>Platform Maintenance Message</Label>
                            <Input placeholder="E.g. We are undergoing scheduled maintenance..." className="bg-muted/30 border-none ring-1 ring-border" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-base">Auto-notify Users</Label>
                                <p className="text-sm text-muted-foreground">Notify users when new destinations are added.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-end gap-4 border-t pt-8">
                <Button variant="ghost" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Discard Changes
                </Button>
                <Button className="gap-2 shadow-lg shadow-primary/20" onClick={handleSave}>
                    <Save className="w-4 h-4" />
                    Save Preferences
                </Button>
            </div>
        </div>
    );
}
