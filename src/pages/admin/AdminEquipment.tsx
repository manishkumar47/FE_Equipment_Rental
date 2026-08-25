import React, { useState, useEffect, useMemo } from "react";
import { equipmentApi } from "../../api/equipment.api";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../api/client";
import { formatCurrency } from "../../utils/formatters";
import { getEquipmentIcon } from "../../utils/categoryIcons";
import type { Category, EquipmentItem } from "../../types/api.types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import {
  Boxes,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { categoryApi } from "../../api/category.api";

export const AdminEquipment: React.FC = () => {
  const { showToast } = useToast();
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    quantity: number;
    price: number;
    imageUrl: string;
    categoryId: number | null;
  }>({
    name: "",
    description: "",
    quantity: 1,
    price: 0,
    imageUrl: "",
    categoryId: null,
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    price?: string;
    quantity?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingItem, setDeletingItem] = useState<EquipmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEquipments = async () => {
    setIsLoading(true);
    try {
      const items = await equipmentApi.getAll();
      setEquipments(items);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setIsLoading(false);
    }
  };
  const fetchCategories = async () => {
    try {
      const items = await categoryApi.getAll();
      setCategories(items);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), "error");
    }
  };

  useEffect(() => {
    fetchEquipments();
    fetchCategories();
  }, []);

  const filteredEquipments = useMemo(() => {
    return equipments.filter((item) => {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [equipments, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      quantity: 5,
      price: 500,
      imageUrl: "",
      categoryId: null,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: EquipmentItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      quantity: item.quantity,
      price: item.price,
      imageUrl: item.imageUrl || "",
      categoryId: item.category?.id || null,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs: typeof formErrors = {};
    if (!formData.name.trim()) errs.name = "Equipment name is required";
    if (formData.price < 0) errs.price = "Price cannot be negative";
    if (formData.quantity < 0) errs.quantity = "Quantity cannot be negative";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editingItem) {
        // Update
        const updated = await equipmentApi.update(editingItem.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          quantity: Number(formData.quantity),
          price: Number(formData.price),
          imageUrl: formData.imageUrl.trim() || null,
        });

        setEquipments((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? { ...item, ...updated } : item,
          ),
        );
        showToast("Equipment updated successfully", "success");
      } else {
        // Create
        const created = await equipmentApi.create({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          quantity: Number(formData.quantity),
          price: Number(formData.price),
          imageUrl: formData.imageUrl.trim() || undefined,
          categoryId: Number(formData.categoryId),
        });

        setEquipments((prev) => [created, ...prev]);
        showToast("Equipment added to fleet catalog", "success");
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEquipment = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    try {
      await equipmentApi.delete(deletingItem.id);
      setEquipments((prev) =>
        prev.filter((item) => item.id !== deletingItem.id),
      );
      showToast("Equipment soft-deleted from catalog", "success");
      setDeletingItem(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="brand" size="sm">
              <Boxes className="w-3 h-3 mr-1" />  Inventory Master
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            Equipment Fleet Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Add new inventory, modify rental tariffs, update unit counts, and
            manage catalog availability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEquipments}
            disabled={isLoading}
            leftIcon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
            }
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Equipment
          </Button>
        </div>
      </div>

      {/* Table Card with Search */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search fleet items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
            Showing {filteredEquipments.length} of {equipments.length} models
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          ) : filteredEquipments.length === 0 ? (
            <EmptyState
              icon={<Package className="w-6 h-6 text-slate-400" />}
              title="No Equipment Items"
              description={
                searchQuery
                  ? "No equipment matched your search term."
                  : 'Your inventory catalog is empty. Click "Add Equipment" to create your first item.'
              }
              actionLabel={searchQuery ? "Clear Search" : "Add First Equipment"}
              onAction={
                searchQuery ? () => setSearchQuery("") : handleOpenAddModal
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Model / Name</th>
                    <th className="px-5 py-3.5">Description</th>
                    <th className="px-5 py-3.5 text-center">Available Stock</th>
                    <th className="px-5 py-3.5">Daily Rate</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEquipments.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-400">
                        #{item.id}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-[#1E3A5F] flex items-center justify-center shrink-0 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            getEquipmentIcon(item.name)
                          )}
                        </div>
                        <span>{item.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                        {item.description || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-slate-800">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={item.quantity > 0 ? "success" : "danger"}
                          size="sm"
                        >
                          {item.quantity > 0 ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-600 hover:text-slate-900"
                            aria-label="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingItem(item)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Equipment Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? `Edit ${editingItem.name}` : "Add New Equipment"}
          description="Enter equipment details, inventory quantity, and daily rental rate"
          maxWidth="md"
        >
          <form onSubmit={handleSaveEquipment} className="space-y-4 text-left">
            <Input
              label="Equipment Name / Model"
              placeholder="e.g. Dell XPS 15, Sony A7 IV"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={formErrors.name}
              autoFocus
            />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                Category
              </label>

              <select
                value={formData.categoryId || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    categoryId: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              >
                <option value="">Select a category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Image URL (Optional)"
              type="url"
              placeholder="https://images.unsplash.com/... or web image link"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              leftIcon={<ImageIcon className="w-4 h-4 text-slate-400" />}
            />

            {formData.imageUrl && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-10 h-10 rounded object-cover border border-slate-200 bg-white shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="text-[11px] text-slate-500 truncate">
                  <p className="font-semibold text-slate-700">Image Preview</p>
                  <p className="truncate max-w-xs">{formData.imageUrl}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                Description / Technical Specifications
              </label>
              <textarea
                rows={3}
                placeholder="Include specifications, ports, condition, accessories..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Available Quantity"
                type="number"
                min={0}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                error={formErrors.quantity}
              />

              <Input
                label="Price per Day (₹)"
                type="number"
                min={0}
                step="any"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                error={formErrors.price}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
              >
                {editingItem ? "Save Changes" : "Add to Inventory"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <ConfirmDialog
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteEquipment}
          title="Delete Equipment"
          message={`Are you sure you want to soft-delete "${deletingItem.name}" (#${deletingItem.id}) from active equipment inventory?`}
          confirmText="Yes, Delete Equipment"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
