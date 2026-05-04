"use client";

import { useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import { UserTable } from "@/components/couriers/UserTable";
import { UserModal } from "@/components/couriers/UserModal";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UsersPage() {
  const { users, loading, createUser, updateUser, deleteUser } = useUsers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const couriers = users.filter(u => u.role === "courier");
  const clients = users.filter(u => u.role === "client");

  const handleOpenCreate = () => {
    setEditingUser(undefined);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      try {
        await deleteUser(id);
        toast.success("Пользователь успешно удален");
      } catch (err) {
        toast.error("Ошибка при удалении пользователя");
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data);
        toast.success("Пользователь успешно обновлен");
      } else {
        await createUser(data);
        toast.success("Пользователь успешно добавлен");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error("Ошибка при сохранении пользователя");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ocean">Пользователи</h1>
        <Button 
          onClick={handleOpenCreate} 
          className="bg-ocean text-cream hover:bg-ocean/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить пользователя
        </Button>
      </div>

      <Tabs defaultValue="couriers" className="w-full">
        <TabsList className="bg-beige/20 border border-beige/30 p-1">
          <TabsTrigger value="couriers" className="data-[state=active]:bg-ocean data-[state=active]:text-cream">
            Курьеры
          </TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-ocean data-[state=active]:text-cream">
            Клиенты
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-10 w-full bg-beige/30" />
            <Skeleton className="h-20 w-full bg-beige/30" />
            <Skeleton className="h-20 w-full bg-beige/30" />
          </div>
        ) : (
          <>
            <TabsContent value="couriers" className="mt-6">
              <UserTable users={couriers} onEdit={handleOpenEdit} onDelete={handleDelete} />
            </TabsContent>
            <TabsContent value="clients" className="mt-6">
              <UserTable users={clients} onEdit={handleOpenEdit} onDelete={handleDelete} />
            </TabsContent>
          </>
        )}
      </Tabs>

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editingUser}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
