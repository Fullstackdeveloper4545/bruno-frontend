import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi } from "@/lib/adminApi";

type LowStockRow = {
  name: string;
  sku: string;
  store_name: string;
  stock_left: number;
};

const LowStockProducts = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LowStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const summary = await adminApi.getDashboardSummary({ threshold: 5, limit: 200 }) as {
        low_stock_products?: Array<{ name?: string; sku?: string; store_name?: string; stock_left?: number }>;
      };
      setRows(
        (summary.low_stock_products || []).map((item) => ({
          name: item.name || "Unnamed Product",
          sku: item.sku || "-",
          store_name: item.store_name || "Unknown Store",
          stock_left: Number(item.stock_left || 0),
        })),
      );
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Failed to load low stock products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Low Stock Products"
        description="Products with stock less than 5, grouped by store assignment."
        actions={
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Dashboard
          </Button>
        }
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Low Stock List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Stock Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No products below stock threshold.</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={`${row.sku}-${row.store_name}-${row.name}`}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.sku}</TableCell>
                    <TableCell>{row.store_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        {row.stock_left} left
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LowStockProducts;
