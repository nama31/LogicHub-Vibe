"use client";

import { useState } from "react";
import { useCouriers } from "@/hooks/useCouriers";
import { CourierTable } from "@/components/couriers/CourierTable";
import { CourierModal } from "@/components/couriers/CourierModal";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";

export default function CouriersPage() {
  const { couriers, loading, createCourier, updateCourier, deleteCourier } = useCouriers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<User | undefined>(undefined);

  const handleOpenCreate = () => {
    setEditingCourier(undefined);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingCourier(user);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этого курьера?")) {
      await deleteCourier(id);
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingCourier) {
      await updateCourier(editingCourier.id, data);
    } else {
      await createCourier({ ...data, role: "courier" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ocean">Курьеры</h1>
        <Button 
          onClick={handleOpenCreate} 
          className="bg-ocean text-cream hover:bg-ocean/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить курьера
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full bg-beige/30" />
          <Skeleton className="h-20 w-full bg-beige/30" />
          <Skeleton className="h-20 w-full bg-beige/30" />
        </div>
      ) : (
        <CourierTable couriers={couriers} onEdit={handleOpenEdit} onDelete={handleDelete} />
      )}

      <CourierModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        courier={editingCourier}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
