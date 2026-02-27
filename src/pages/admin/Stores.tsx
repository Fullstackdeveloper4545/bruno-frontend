import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { adminApi } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Store = {
  id: string | number;
  name: string;
  region_district: string;
  priority_level: number;
  address: string;
  is_active?: boolean;
  regions: string[];
};

type StoreForm = {
  name: string;
  region_district: string;
  priority_level: string;
  address: string;
  regions: string;
  is_active: boolean;
};

const emptyForm: StoreForm = {
  name: "",
  region_district: "",
  priority_level: "1",
  address: "",
  regions: "",
  is_active: true,
};

const parseRegions = (raw: string) => {
  const unique = new Set<string>();
  raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => Boolean(item))
    .forEach((item) => unique.add(item));
  return Array.from(unique);
};

const toForm = (store: Store): StoreForm => ({
  name: store.name || "",
  region_district: store.region_district || "",
  priority_level: String(store.priority_level ?? 1),
  address: store.address || "",
  regions: Array.isArray(store.regions) ? store.regions.join(", ") : "",
  is_active: store.is_active !== false,
});

const Stores = () => {
  const [rows, setRows] = useState<Store[]>([]);
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [activeStoreActionId, setActiveStoreActionId] = useState<string | number | null>(null);

  const activeStoreCount = useMemo(
    () => rows.filter((store) => store.is_active !== false).length,
    [rows],
  );
  const canDeleteStores = rows.length > 1;

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const storesResult = await adminApi.listStores() as Promise<Store[]>;

      const safeRows = Array.isArray(storesResult) ? storesResult : [];
      setRows(safeRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stores");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSaveStore = async () => {
    const name = form.name.trim();
    const regionDistrict = form.region_district.trim();
    const address = form.address.trim();
    const priorityLevel = Number(form.priority_level);
    const regions = parseRegions(form.regions);

    if (!name) {
      setError("Store name is required.");
      setSuccess("");
      return;
    }
    if (!regionDistrict) {
      setError("Region/District is required.");
      setSuccess("");
      return;
    }
    if (!Number.isInteger(priorityLevel) || priorityLevel < 1) {
      setError("Priority must be an integer greater than 0.");
      setSuccess("");
      return;
    }
    if (!address) {
      setError("Address is required.");
      setSuccess("");
      return;
    }

    const payload = {
      name,
      region_district: regionDistrict,
      priority_level: priorityLevel,
      address,
      regions,
      is_active: form.is_active,
    };

    try {
      setSavingStore(true);
      setError("");
      setSuccess("");

      if (editingId != null) {
        await adminApi.updateStore(editingId, payload);
        setSuccess("Store updated.");
      } else {
        await adminApi.createStore(payload);
        setSuccess("Store created.");
      }

      resetForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save store");
      setSuccess("");
    } finally {
      setSavingStore(false);
    }
  };

  const handleDeleteStore = async (storeId: string | number) => {
    try {
      setError("");
      setSuccess("");
      await adminApi.deleteStore(storeId);
      setSuccess("Store deleted.");
      if (editingId === storeId) {
        resetForm();
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete store");
      setSuccess("");
    }
  };

  const handleToggleStoreStatus = async (store: Store) => {
    if (store.is_active !== false && activeStoreCount <= 1) {
      setError("At least one active store is required.");
      setSuccess("");
      return;
    }

    try {
      setActiveStoreActionId(store.id);
      setError("");
      setSuccess("");
      await adminApi.updateStore(store.id, { is_active: store.is_active === false });
      setSuccess(`Store ${store.is_active === false ? "activated" : "deactivated"}.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update store status");
      setSuccess("");
    } finally {
      setActiveStoreActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Management"
        description="Manage stores, priority, addresses, and mapped regions."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-success">{success}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Stores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Regions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Loading stores...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    No stores configured yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const isActive = row.is_active !== false;
                  const isBusy = activeStoreActionId === row.id;
                  const isLastActive = isActive && activeStoreCount <= 1;

                  return (
                    <TableRow key={String(row.id)}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{isActive ? "Active" : "Inactive"}</TableCell>
                      <TableCell>{row.region_district || "-"}</TableCell>
                      <TableCell>{row.priority_level ?? "-"}</TableCell>
                      <TableCell>{row.address || "-"}</TableCell>
                      <TableCell>{(row.regions || []).join(", ") || "-"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingId(row.id);
                            setForm(toForm(row));
                            setSuccess("");
                            setError("");
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBusy || isLastActive}
                          onClick={() => void handleToggleStoreStatus(row)}
                        >
                          {isBusy ? "Saving..." : isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <ConfirmDeleteButton
                          entityName={`store "${row.name}"`}
                          onConfirm={() => handleDeleteStore(row.id)}
                          disabled={!canDeleteStores}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {!canDeleteStores ? (
            <p className="mt-3 text-xs text-muted-foreground">
              At least one store must remain configured.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId != null ? "Edit Store" : "Create Store"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Store name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="Region/District"
            value={form.region_district}
            onChange={(e) => setForm((prev) => ({ ...prev, region_district: e.target.value }))}
          />
          <Input
            placeholder="Priority"
            type="number"
            min={1}
            value={form.priority_level}
            onChange={(e) => setForm((prev) => ({ ...prev, priority_level: e.target.value }))}
          />
          <Input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
          <Input
            placeholder="Mapped regions (comma separated)"
            value={form.regions}
            onChange={(e) => setForm((prev) => ({ ...prev, regions: e.target.value }))}
          />
          <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            Active
          </label>
          <div className="flex gap-2 md:col-span-3">
            <Button disabled={savingStore} onClick={() => void handleSaveStore()}>
              {savingStore ? "Saving..." : editingId != null ? "Update Store" : "Create Store"}
            </Button>
            {editingId != null ? (
              <Button variant="secondary" onClick={resetForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stores;
