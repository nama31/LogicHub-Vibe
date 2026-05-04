"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/useUsers";
import { useOrders } from "@/hooks/useOrders";

interface AssignModalProps {
  orderId: number | string;
  isOpen: boolean;
  onClose: () => void;
  onAssigned?: () => void;
}

export function AssignModal({ orderId, isOpen, onClose, onAssigned }: AssignModalProps) {
  const { users: couriers } = useUsers({ role: "courier" });
  const { assignCourier } = useOrders();
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssign = async () => {
    if (!selectedCourierId) return;
    setIsSubmitting(true);
    try {
      await assignCourier(orderId, selectedCourierId);
      onAssigned?.();
      onClose();
    } catch (error) {
      console.error("Failed to assign courier:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-ocean">Назначить курьера</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Выберите ответственного курьера для выполнения заказа <span className="font-bold text-ocean">#{orderId}</span>.
            </p>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-ocean ml-1">Активные курьеры</label>
              <Select onValueChange={(val) => setSelectedCourierId(val as string)} value={selectedCourierId}>
                <SelectTrigger className="w-full text-ocean">
                  <SelectValue placeholder="Выберите курьера из списка" />
                </SelectTrigger>
                <SelectContent>
                  {couriers.filter(c => c.is_active).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  {couriers.filter(c => c.is_active).length === 0 && (
                     <SelectItem disabled value="none">Нет активных курьеров</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedCourierId || isSubmitting}
            className="px-8"
          >
            {isSubmitting ? "Назначение..." : "Назначить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
