import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

const TIMEZONE = "America/Argentina/Buenos_Aires";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function toISOString(dateStr: string, timeStr: string): string {
  // El frontend envía date (YYYY-MM-DD) y time (HH:mm). Se construye un
  // ISO string a partir de la combinación exacta, tal como lo espera
  // Google Calendar para el campo dateTime.
  return new Date(`${dateStr}T${timeStr || "09:00"}`).toISOString();
}

function addOneHour(iso: string): string {
  const d = new Date(iso);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

async function getValidAccessToken(
  supabaseAdmin: any,
  userId: string,
): Promise<string | null> {
  const { data: integration, error } = await supabaseAdmin
    .from("user_integrations")
    .select("refresh_token, access_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .single();

  if (error || !integration?.refresh_token) return null;

  const expiresAt = integration.expires_at
    ? new Date(integration.expires_at).getTime()
    : 0;
  const now = Date.now();
  const buffer = 60 * 1000; // 1 minuto de margen

  if (integration.access_token && expiresAt && now < expiresAt - buffer) {
    return integration.access_token;
  }

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    refresh_token: integration.refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const token = await res.json();
  if (!res.ok || !token.access_token) {
    console.error("Error refrescando token de Google:", token);
    return null;
  }

  const newExpiresAt = new Date(
    now + token.expires_in * 1000,
  ).toISOString();
  await supabaseAdmin
    .from("user_integrations")
    .update({
      access_token: token.access_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("provider", "google_calendar");

  return token.access_token;
}

function buildEventBody(event: any) {
  const date = event.date;
  const time = event.time || "09:00";
  if (!date) {
    throw new Error("El evento no tiene fecha (date)");
  }
  const start = toISOString(date, time);
  const end = addOneHour(start);
  return {
    summary: event.title || "Evento EstateCRM",
    description: event.description || event.notes || "",
    start: { dateTime: start, timeZone: TIMEZONE },
    end: { dateTime: end, timeZone: TIMEZONE },
  };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const authHeader = req.headers.authorization;
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: { user: caller }, error: authError } =
      await supabaseAdmin.auth.getUser(authHeader?.replace("Bearer ", ""));
    if (authError || !caller) {
      return res.status(401).json({ error: "No autorizado" });
    }

    console.log("GOOGLE CALENDAR SYNC BODY:", JSON.stringify(req.body, null, 2));

    const { action, event } = req.body;
    console.log("GOOGLE CALENDAR SYNC EVENT:", JSON.stringify(event, null, 2));
    if (!action || !event) {
      return res.status(400).json({ error: "Faltan action o event" });
    }
    if (!event.date) {
      return res.status(400).json({ error: "Falta event.date" });
    }

    const accessToken = await getValidAccessToken(supabaseAdmin, caller.id);
    if (!accessToken) {
      return res
        .status(400)
        .json({ error: "Google Calendar no está conectado" });
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    if (action === "delete") {
      const googleEventId = event.googleCalendarEventId;
      if (!googleEventId) {
        return res.status(200).json({ success: true });
      }
      const delRes = await fetch(`${CALENDAR_API_BASE}/${googleEventId}`, {
        method: "DELETE",
        headers,
      });
      if (!delRes.ok && delRes.status !== 404 && delRes.status !== 410) {
        const err = await delRes.json();
        throw new Error(err.error?.message || "Error eliminando evento");
      }
      return res.status(200).json({ success: true });
    }

    if (action === "update") {
      const googleEventId = event.googleCalendarEventId;
      if (googleEventId) {
        const updRes = await fetch(`${CALENDAR_API_BASE}/${googleEventId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(buildEventBody(event)),
        });
        if (!updRes.ok) {
          const err = await updRes.json();
          throw new Error(err.error?.message || "Error actualizando evento");
        }
        const data = await updRes.json();
        return res.status(200).json({ googleEventId: data.id });
      }
      // Si no existe ID remoto, caer al create.
    }

    if (action === "create" || action === "update") {
      const createRes = await fetch(CALENDAR_API_BASE, {
        method: "POST",
        headers,
        body: JSON.stringify(buildEventBody(event)),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error?.message || "Error creando evento");
      }
      const data = await createRes.json();
      return res.status(200).json({ googleEventId: data.id });
    }

    return res.status(400).json({ error: "Acción inválida" });
  } catch (error: any) {
    console.error("CRASH EN GOOGLE CALENDAR SYNC:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
