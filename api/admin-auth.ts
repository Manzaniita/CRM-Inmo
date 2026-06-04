import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  console.log("--- INICIO PETICIÓN ADMIN API ---");
  try {
    const { userId, updates } = req.body;
    const authHeader = req.headers.authorization;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno");
    }

    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Verificar quien llama (Seguridad)
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(authHeader?.replace('Bearer ', ''));
    if (authError || !caller) throw new Error("No autorizado: " + authError?.message);

    // 2. Verificar Rol
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('user_id', caller.id).single();
    if (profile?.role !== 'superadmin') throw new Error("Prohibido: Solo superadmins");

    console.log(`Ejecutando update para usuario: ${userId}`, updates);

    // 3. Ejecutar Cambio
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);
    
    if (updateError) {
      console.error("Error de Supabase Auth Admin:", updateError);
      return res.status(updateError.status || 400).json({ error: updateError.message });
    }

    console.log("Update exitoso");
    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error("CRASH EN API:", error.message);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
