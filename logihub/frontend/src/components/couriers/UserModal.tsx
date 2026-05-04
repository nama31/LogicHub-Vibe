"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User, UserRole } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserFormData = {
  name: string;
  role: UserRole;
  tg_id: number | null;
  phone?: string;
  is_active?: boolean;
};

type UserFormErrors = Partial<Record<keyof UserFormData, string>>;

interface UserModalProps {
  user?: User;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<any>;
}

const EMPTY_VALUES: UserFormData = {
  name: "",
  role: "courier",
  tg_id: null,
  phone: "",
};

export function UserModal({ user, open, onClose, onSubmit }: UserModalProps) {
  const isEdit = Boolean(user);
  const [values, setValues] = useState<UserFormData>(EMPTY_VALUES);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, "");
    if (digits.length === 0) return "";
    
    let cleanDigits = digits;
    if (digits.startsWith("996")) {
      cleanDigits = digits.substring(3);
    }
    
    const main = cleanDigits.substring(0, 9);
    let formatted = "+996";
    
    if (main.length > 0) {
      formatted += " " + main.substring(0, 3);
    }
    if (main.length > 3) {
      formatted += " " + main.substring(3, 6);
    }
    if (main.length > 6) {
      formatted += " " + main.substring(6, 9);
    }
    
    return formatted;
  };

  useEffect(() => {
    if (!open) return;

    setValues(
      user
        ? {
            name: user.name,
            role: user.role,
            tg_id: user.tg_id ?? null,
            phone: user.phone ?? "",
            is_active: user.is_active,
          }
        : EMPTY_VALUES,
    );
    setErrors({});
    setIsSubmitting(false);
  }, [open, user]);

  function updateField<K extends keyof UserFormData>(field: K, value: UserFormData[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(nextValues: UserFormData): UserFormErrors {
    const nextErrors: UserFormErrors = {};

    if (!nextValues.name.trim()) {
      nextErrors.name = "Введите имя";
    }

    if (nextValues.role !== "admin" && !nextValues.phone?.trim()) {
      nextErrors.phone = "Введите номер телефона для регистрации в боте";
    }

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const phoneValue = values.phone?.trim() || "";
      const cleanPhone = phoneValue ? "+" + phoneValue.replace(/\D/g, "") : "";
      
      await onSubmit({
        name: values.name.trim(),
        role: values.role,
        tg_id: values.tg_id,
        ...(cleanPhone ? { phone: cleanPhone } : {}),
        is_active: values.is_active,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md bg-cream border-border">
        <DialogHeader>
          <DialogTitle className="text-ocean">
            {isEdit ? "Редактировать пользователя" : "Добавить пользователя"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit
              ? "Измените данные существующего пользователя"
              : "Заполните данные для добавления нового пользователя."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-ocean font-medium">Имя</Label>
            <Input
              id="name"
              placeholder="Например: Азамат"
              className="h-10 border-beige focus-visible:ring-ocean"
              value={values.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-ocean font-medium">Роль</Label>
            <Select 
              value={values.role} 
              onValueChange={(val) => updateField("role", val as UserRole)}
              disabled={isEdit}
            >
              <SelectTrigger className="h-10 border-beige focus:ring-ocean">
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="courier">Курьер</SelectItem>
                <SelectItem value="client">Клиент</SelectItem>
                <SelectItem value="admin">Админ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tg_id" className="text-ocean font-medium">Telegram ID (необязательно)</Label>
            <Input
              id="tg_id"
              type="number"
              placeholder="Будет заполнено автоматически при регистрации"
              className="h-10 border-beige focus-visible:ring-ocean bg-beige/10"
              value={values.tg_id === null ? "" : values.tg_id}
              onChange={(e) => {
                const val = e.target.value;
                updateField("tg_id", val === "" ? null : Number(val));
              }}
            />
            {values.role !== "admin" && (
                <p className="text-[10px] text-muted-foreground mt-1">
                Если оставить пустым, пользователь сможет зарегистрироваться сам через бот по номеру телефона.
                </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-ocean font-medium">Телефон (для регистрации в боте)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+996 771 123 456"
              className="h-10 border-beige focus-visible:ring-ocean"
              value={values.phone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                updateField("phone", formatted);
              }}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {isEdit && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={values.is_active ?? true}
                onChange={(e) => updateField("is_active", e.target.checked)}
                className="w-4 h-4 text-ocean border-beige rounded focus:ring-ocean"
              />
              <Label htmlFor="is_active" className="text-ocean font-medium cursor-pointer">
                Пользователь активен
              </Label>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-beige text-ocean hover:bg-beige/20"
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-ocean text-cream hover:bg-ocean/90"
            >
              {isSubmitting ? "Сохранение..." : isEdit ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
