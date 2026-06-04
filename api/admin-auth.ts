// @ts-nocheck
/**
 * Vercel Serverless Function: Admin Auth proxy.
 * Updates user email/password using Supabase Auth Admin API.
 * Requires SUPABASE_SERVICE_ROLE_KEY env var.
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return res.status(500).json({ error: "Missing Supabase environment variables" });
  }

  const { action, userId, email, password } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // 1. Verify caller token
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
    });
    const caller = await verifyRes.json();
    if (!verifyRes.ok || !caller.id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // 2. Verify caller is superadmin
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=role&user_id=eq.${caller.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
      },
    );
    const profiles = await profileRes.json();
    if (!Array.isArray(profiles) || profiles.length === 0 || profiles[0].role !== "superadmin") {
      return res.status(403).json({ error: "Forbidden: superadmin required" });
    }

    // 3. Execute action
    if (action === "updateUser") {
      const updates: any = {};
      if (email) updates.email = email;
      if (password) updates.password = password;

      const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        return res.status(500).json({
          error: updateData.message || updateData.error_description || "Update failed",
        });
      }
      return res.status(200).json({ success: true, user: updateData });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
