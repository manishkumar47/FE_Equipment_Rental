import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { equipmentUnitApi } from '../../api/equipmentUnit.api';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/client';
import type { EquipmentItem, EquipmentUnit, EquipmentUnitStatus } from '../../types/api.types';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';
import { Modal } from '../molecules/Modal';
import { ConfirmDialog } from '../molecules/ConfirmDialog';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';
import { Plus, Trash2, Edit2, Check, X as XIcon, Barcode } from 'lucide-react';

const STATUS_OPTIONS: EquipmentUnitStatus[] = [
  'available',
  'rented',
  'under_repair',
  'damaged',
  'lost',
  'retired',
];

const STATUS_LABEL: Record<EquipmentUnitStatus, string> = {
  available: 'Available',
  rented: 'Rented',
  under_repair: 'Under Repair',
  damaged: 'Damaged',
  lost: 'Lost',
  retired: 'Retired',
};

const STATUS_BADGE_VARIANT: Record<
  EquipmentUnitStatus,
  'success' | 'brand' | 'warning' | 'danger' | 'neutral'
> = {
  available: 'success',
  rented: 'brand',
  under_repair: 'warning',
  damaged: 'danger',
  lost: 'danger',
  retired: 'neutral',
};

export interface EquipmentUnitsModalProps {
  equipment: EquipmentItem;
  isOpen: boolean;
  onClose: () => void;
  /** Called when units were added/edited/removed, so the caller can refresh counts. */
  onChanged?: () => void;
}

export const EquipmentUnitsModal: React.FC<EquipmentUnitsModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onChanged,
}) => {
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [units, setUnits] = useState<EquipmentUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [changed, setChanged] = useState(false);

  // Add-unit inline form
  const [newSerial, setNewSerial] = useState('');
  const [newStatus, setNewStatus] = useState<EquipmentUnitStatus>('available');
  const [newNotes, setNewNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Inline edit
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editSerial, setEditSerial] = useState('');
  const [editStatus, setEditStatus] = useState<EquipmentUnitStatus>('available');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete
  const [deletingUnit, setDeletingUnit] = useState<EquipmentUnit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const rows = await equipmentUnitApi.getAll(equipment.id);
      setUnits(rows);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setChanged(false);
      fetchUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, equipment.id]);

  const summary = useMemo(() => {
    const total = units.length;
    const available = units.filter((u) => u.status === 'available').length;
    return { total, available };
  }, [units]);

  const handleClose = () => {
    if (changed) onChanged?.();
    onClose();
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSerial.trim()) {
      showToast(t('SERIAL_NUMBER_REQUIRED'), 'error');
      return;
    }

    setIsAdding(true);
    try {
      const created = await equipmentUnitApi.create(equipment.id, {
        serialNumber: newSerial.trim(),
        status: newStatus,
        conditionNotes: newNotes.trim() || undefined,
      });
      setUnits((prev) => [...prev, created]);
      setChanged(true);
      setNewSerial('');
      setNewStatus('available');
      setNewNotes('');
      showToast(t('UNIT_REGISTERED_SUCCESSFULLY'), 'success');
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleStartEdit = (unit: EquipmentUnit) => {
    setEditingUnitId(unit.id);
    setEditSerial(unit.serialNumber);
    setEditStatus(unit.status);
    setEditNotes(unit.conditionNotes || '');
  };

  const handleCancelEdit = () => setEditingUnitId(null);

  const handleSaveEdit = async (unit: EquipmentUnit) => {
    setIsSavingEdit(true);
    try {
      const updated = await equipmentUnitApi.update(equipment.id, unit.id, {
        serialNumber: editSerial.trim(),
        status: editStatus,
        conditionNotes: editNotes.trim() || undefined,
      });
      setUnits((prev) => prev.map((u) => (u.id === unit.id ? updated : u)));
      setChanged(true);
      setEditingUnitId(null);
      showToast(t('UNIT_UPDATED_SUCCESSFULLY'), 'success');
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUnit) return;
    setIsDeleting(true);
    try {
      await equipmentUnitApi.delete(equipment.id, deletingUnit.id);
      setUnits((prev) => prev.filter((u) => u.id !== deletingUnit.id));
      setChanged(true);
      showToast(t('UNIT_DELETED_SUCCESSFULLY'), 'success');
      setDeletingUnit(null);
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Physical Units — ${equipment.name}`}
        description="Track individually serialized units for this equipment (condition, damage, loss)"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-left">
          {/* Summary */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" size="sm">
              <Barcode className="w-3 h-3 mr-1" /> {summary.total} registered unit
              {summary.total === 1 ? '' : 's'}
            </Badge>
            <Badge variant={summary.available > 0 ? 'success' : 'neutral'} size="sm">
              {summary.available} available
            </Badge>
            <span className="text-[11px] text-slate-400">
              Catalog stock count (quantity) stays independent and is edited on the equipment
              itself.
            </span>
          </div>

          {/* Add unit form */}
          <form
            onSubmit={handleAddUnit}
            className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1.2fr_auto] gap-2 items-end p-3 rounded-lg bg-slate-50 border border-slate-200"
          >
            <Input
              label="Serial / Asset Tag"
              placeholder="e.g. DRILL-3-004"
              value={newSerial}
              onChange={(e) => setNewSerial(e.target.value)}
            />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as EquipmentUnitStatus)}
                className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Condition Notes (optional)"
              placeholder="e.g. Minor scratches"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
            <Button type="submit" variant="primary" size="sm" isLoading={isAdding} leftIcon={<Plus className="w-4 h-4" />}>
              Add
            </Button>
          </form>

          {/* Units table */}
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="w-full h-9" />
              <Skeleton className="w-full h-9" />
              <Skeleton className="w-full h-9" />
            </div>
          ) : units.length === 0 ? (
            <EmptyState
              icon={<Barcode className="w-6 h-6 text-slate-400" />}
              title="No Physical Units Registered"
              description="Register a serial number / asset tag above to start tracking individual units for this equipment."
            />
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Serial / Tag</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5">Condition Notes</th>
                    <th className="px-3.5 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {units.map((unit) => {
                    const isEditing = editingUnitId === unit.id;
                    return (
                      <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2 font-mono text-slate-800">
                          {isEditing ? (
                            <input
                              value={editSerial}
                              onChange={(e) => setEditSerial(e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                            />
                          ) : (
                            unit.serialNumber
                          )}
                        </td>
                        <td className="px-3.5 py-2">
                          {isEditing ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as EquipmentUnitStatus)}
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABEL[s]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Badge variant={STATUS_BADGE_VARIANT[unit.status]} size="sm">
                              {STATUS_LABEL[unit.status]}
                            </Badge>
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-slate-500 max-w-xs truncate">
                          {isEditing ? (
                            <input
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Condition notes"
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                            />
                          ) : (
                            unit.conditionNotes || '—'
                          )}
                        </td>
                        <td className="px-3.5 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSaveEdit(unit)}
                                  isLoading={isSavingEdit}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  aria-label="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  disabled={isSavingEdit}
                                  className="p-1.5 text-slate-500 hover:text-slate-700"
                                  aria-label="Cancel"
                                >
                                  <XIcon className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEdit(unit)}
                                  className="p-1.5 text-slate-600 hover:text-slate-900"
                                  aria-label="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingUnit(unit)}
                                  className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-end pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {deletingUnit && (
        <ConfirmDialog
          isOpen={!!deletingUnit}
          onClose={() => setDeletingUnit(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Unit"
          message={`Remove unit "${deletingUnit.serialNumber}" from tracking? This soft-deletes the record.`}
          confirmText="Yes, Delete Unit"
          variant="danger"
          isLoading={isDeleting}
        />
      )}
    </>
  );
};
