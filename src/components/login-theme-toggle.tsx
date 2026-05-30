"use client";

import { ThemeToggle } from "./theme-toggle";

export function LoginThemeToggle() {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 10,
      }}
    >
      <ThemeToggle />
    </div>
  );
}
