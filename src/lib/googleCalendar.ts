import { supabase } from "./supabase";
import type { CalendarEvent } from "../types";

export type GoogleCalendarAction = "create" | "update" | "delete";

export async function syncEventToGoogle(
  action: GoogleCalendarAction,
  event: Partial<CalendarEvent>,
): Promise<{ googleEventId?: string }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) return {};

    const res = await fetch("/api/google-calendar-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action, event }),
    });
    const result = await res.json();
    if (!res.ok) {
      console.error("Google Calendar sync error:", result.error);
      return {};
    }
    return { googleEventId: result.googleEventId };
  } catch (e: any) {
    console.error("Google Calendar sync failed:", e.message);
    return {};
  }
}
