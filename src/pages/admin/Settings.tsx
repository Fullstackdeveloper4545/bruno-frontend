import { Sliders } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const modules = [
  "Products",
  "Orders",
  "Payments",
  "Discounts",
  "Shipping",
  "Invoices",
  "Reports",
  "Customers",
];

const Settings = () => {
  return (
    <div className="space-y-8">
      <PageHeader
        title="System Settings"
        description="Configure site-wide settings, VAT, email, and module access."
        actions={
          <Button variant="outline">
            <Sliders className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-xl">General Settings</CardTitle>
            <CardDescription>Core platform configuration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Site Name</label>
              <Input placeholder="Backoffice Admin" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Input placeholder="EUR" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">VAT Configuration</label>
              <Input placeholder="23% VAT" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Settings</label>
              <Input placeholder="notifications@ecom.pt" />
            </div>
          </CardContent>
        </Card>

      </div>

      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="font-display text-xl">Module Activation</CardTitle>
          <CardDescription>Control which modules are active.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {modules.map((module) => (
            <div key={module} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/70 p-3">
              <p className="text-sm font-medium">{module}</p>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
