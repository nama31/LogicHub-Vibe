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
import type { UserCreateData, UserUpdateData } from "@/hooks/useUsers";

type UserSubmitData = UserCreateData & Pick<UserUpdateData, "is_active">;

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
      } catch {
        toast.error("Ошибка при удалении пользователя");
      }
    }
  };

  const handleSubmit = async (data: UserSubmitData) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, data);
        toast.success("Пользователь успешно обновлен");
      } else {
        await createUser(data);
        toast.success("Пользователь успешно добавлен");
      }
      setModalOpen(false);
    } catch {
      toast.error("Ошибка при сохранении пользователя");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ocean tracking-tight">Пользователи</h1>
          <p className="mt-1 text-sm text-muted-foreground">Единый список курьеров и клиентов LogiHub.</p>
        </div>
        <Button 
          onClick={handleOpenCreate} 
          className="h-11 px-5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить пользователя
        </Button>
      </div>

      <Tabs defaultValue="couriers" className="w-full">
        <TabsList>
          <TabsTrigger value="couriers">
            Курьеры
          </TabsTrigger>
          <TabsTrigger value="clients">
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
