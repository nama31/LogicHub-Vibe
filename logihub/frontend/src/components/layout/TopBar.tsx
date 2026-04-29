"use client";

// Calls GET /auth/me to display current user name
// Provides logout button (clears token from localStorage)

export function TopBar() {
  return (
    <header>
      <span>LogiHub</span>
      {/* TODO: show user.name + logout button */}
    </header>
  );
}
