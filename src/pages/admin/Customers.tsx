import { Ban, KeyRound } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const customers = [
  { name: "Maria Silva", email: "maria@cliente.pt", orders: 12, status: "Active" },
  { name: "Diego Ruiz", email: "diego@cliente.es", orders: 7, status: "Active" },
  { name: "Ana Santos", email: "ana@cliente.pt", orders: 3, status: "Inactive" },
];

const Customers = () => {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Customer Management"
        description="Review customer activity, orders, and account controls."
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-xl">Customer List</CardTitle>
            <CardDescription>Active and inactive accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.email}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.orders}</TableCell>
                    <TableCell>
                      <StatusBadge status={customer.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="font-display text-xl">Customer Profile</CardTitle>
            <CardDescription>Selected customer summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-background/70 p-4">
              <p className="text-sm font-medium">Maria Silva</p>
              <p className="text-xs text-muted-foreground">maria@cliente.pt</p>
              <p className="text-xs text-muted-foreground">Last active: Today</p>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Orders:</span> 12
              </p>
              <p>
                <span className="text-muted-foreground">Total Spend:</span> EUR 1,420
              </p>
              <p>
                <span className="text-muted-foreground">Last Order:</span> ORD-1024
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              <Button size="sm" variant="destructive">
                <Ban className="mr-2 h-4 w-4" />
                Disable Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Customers;
