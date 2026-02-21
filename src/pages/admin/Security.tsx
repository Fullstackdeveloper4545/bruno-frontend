import { Lock, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const loginActivity = [
  { date: "Feb 11, 2026", location: "Lisbon", status: "Success" },
  { date: "Feb 10, 2026", location: "Porto", status: "Success" },
  { date: "Feb 09, 2026", location: "Madrid", status: "Success" },
];

const Security = () => {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Security"
        description="Manage authentication, session settings, and access controls."
        actions={
          <Button variant="outline">
            <Lock className="mr-2 h-4 w-4" />
            Logout
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="font-display text-xl">Change Password</CardTitle>
          <CardDescription>Update admin credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-background/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Login</p>
            <p className="text-sm font-medium">admin@ecom.pt</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <Input type="password" placeholder="********" />
          </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" placeholder="********" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Timeout</label>
              <Input placeholder="30 minutes" />
            </div>
            <Button>Save Password</Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-xl">Security Enhancements</CardTitle>
            <CardDescription>Optional protections for future-ready setup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-3">
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-muted-foreground">Extra login verification</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-3">
              <div>
                <p className="text-sm font-medium">Role system (future-ready)</p>
                <p className="text-xs text-muted-foreground">Prepare for multi-admin access</p>
              </div>
              <Switch />
            </div>
            <Button variant="outline" className="w-full">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Review Policies
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="font-display text-xl">Login Activity Log</CardTitle>
          <CardDescription>Recent admin sign-ins.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loginActivity.map((entry) => (
                <TableRow key={entry.date}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.location}</TableCell>
                  <TableCell>
                    <StatusBadge status={entry.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Security;
