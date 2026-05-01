"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@/types/user";
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

type CourierFormData = {
  name: string;
  tg_id: number | null;
  phone?: string;
  is_active?: boolean;
};

type CourierFormErrors = Partial<Record<keyof CourierFormData, string>>;

interface CourierModalProps {
  courier?: User;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CourierFormData) => Promise<any>;
}

const EMPTY_VALUES: CourierFormData = {
  name: "",
  tg_id: null,
  phone: "",
};

export function CourierModal({ courier, open, onClose, onSubmit }: CourierModalProps) {
  const isEdit = Boolean(courier);
  const [values, setValues] = useState<CourierFormData>(EMPTY_VALUES);
  const [errors, setErrors] = useState<CourierFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhoneNumber = (input: string) => {
    const digits = input.replace(/\D/g, "");
    if (digits.length === 0) return "";
    
    let cleanDigits = digits;
    // Если введено с 996 в начале, убираем его для форматирования
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
      courier
        ? {
            name: courier.name,
            tg_id: courier.tg_id ?? null,
            phone: courier.phone ?? "",
            is_active: courier.is_active,
          }
        : EMPTY_VALUES,
    );
    setErrors({});
    setIsSubmitting(false);
  }, [open, courier]);

  function updateField<K extends keyof CourierFormData>(field: K, value: CourierFormData[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(nextValues: CourierFormData): CourierFormErrors {
    const nextErrors: CourierFormErrors = {};

    if (!nextValues.name.trim()) {
      nextErrors.name = "Введите имя курьера";
    }

    if (!nextValues.phone?.trim()) {
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
      // Сохраняем в БД чистый номер с плюсом для консистентности
      const cleanPhone = phoneValue ? "+" + phoneValue.replace(/\D/g, "") : "";
      
      await onSubmit({
        name: values.name.trim(),
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
            {isEdit ? "Редактировать курьера" : "Добавить курьера"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit
              ? "Измените данные существующего курьера"
              : "Заполните данные для добавления нового курьера. Telegram ID обязателен для работы бота."}
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
            <p className="text-[10px] text-muted-foreground mt-1">
              Если оставить пустым, курьер сможет зарегистрироваться сам через бот по номеру телефона.
            </p>
            {errors.tg_id && <p className="text-xs text-destructive">{errors.tg_id}</p>}
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
                Курьер активен
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
