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
import { useCouriers } from "@/hooks/useCouriers";
import { useOrders } from "@/hooks/useOrders";

interface AssignModalProps {
  orderId: number | string;
  isOpen: boolean;
  onClose: () => void;
  onAssigned?: () => void;
}

export function AssignModal({ orderId, isOpen, onClose, onAssigned }: AssignModalProps) {
  const { couriers } = useCouriers();
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
      <DialogContent className="sm:max-w-[425px] bg-card border-beige rounded-3xl p-0 overflow-hidden shadow-2xl">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-ocean">Назначить курьера</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Выберите ответственного курьера для выполнения заказа <span className="font-bold text-ocean">#{orderId}</span>.
            </p>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-ocean ml-1">Активные курьеры</label>
              <Select onValueChange={(val) => setSelectedCourierId(val as string)} value={selectedCourierId}>
                <SelectTrigger className="w-full bg-cream/30 border-beige text-ocean h-12 rounded-xl transition-all focus:ring-2 focus:ring-ocean/10">
                  <SelectValue placeholder="Выберите курьера из списка" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-beige shadow-xl">
                  {couriers.filter(c => c.is_active).map((c) => (
                    <SelectItem key={c.id} value={c.id} className="py-3 focus:bg-beige/30 rounded-lg mx-1">
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

        <DialogFooter className="bg-beige/20 p-4 gap-3 border-t border-beige/30">
          <Button variant="ghost" onClick={onClose} className="text-ocean font-medium hover:bg-beige/30 rounded-xl px-6 h-11">
            Отмена
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedCourierId || isSubmitting}
            className="bg-ocean text-cream hover:bg-ocean/90 font-bold rounded-xl px-8 h-11 transition-all active:scale-95 shadow-lg shadow-ocean/20"
          >
            {isSubmitting ? "Назначение..." : "Назначить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
