"use client";

// POST /users { name, role: "courier", tg_id, phone }
// tg_id is required — courier auth in the Telegram bot uses it

interface CourierFormProps {
  onSuccess?: () => void;
}

export function CourierForm({ onSuccess }: CourierFormProps) {
  return (
    <form>
      <h2>Добавить курьера</h2>
      {/* TODO: name input */}
      {/* TODO: tg_id number input */}
      {/* TODO: phone input */}
      <button type="submit">Создать</button>
    </form>
  );
}
