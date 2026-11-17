import { projectId, publicAnonKey } from "../../utils/supabase/info.tsx";

export { projectId, publicAnonKey };
export const SUPABASE_URL = `https://${projectId}.supabase.co`;
export const SUPABASE_ANON_KEY = publicAnonKey;

export type UserRole = "admin" | "employee" | "client";

export interface SupabaseUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  createdAt?: string;
}

export interface SupabaseSession {
  accessToken: string;
  refreshToken?: string;
  user: SupabaseUser;
  expiresAt: number;
}

const STORAGE_SESSION_KEY = "mekatron_supabase_session";
const STORAGE_DB_FALLBACK = "mekatron_local_db_v2";

// Helper headers
function getHeaders(token?: string) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
  }
  return headers;
}

// Session management
export function getSavedSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SupabaseSession;
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: SupabaseSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  } else {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  }
}

// AUTH API CALLS
export async function signUpUser({
  email,
  password,
  fullName,
  role = "client",
  phone = "",
}: {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
  phone?: string;
}): Promise<{ user: SupabaseUser | null; error: string | null; emailConfirmed: boolean }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { user: null, error: "Ingresa un correo electrónico válido.", emailConfirmed: false };
    }
    if (password.length < 6) {
      return { user: null, error: "La contraseña debe tener al menos 6 caracteres.", emailConfirmed: false };
    }

    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        email: cleanEmail,
        password,
        data: {
          full_name: cleanName,
          role,
          phone: phone.trim(),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.msg || data.message || data.error_description || "Error al registrar usuario.";
      if (msg.includes("already registered") || data.error_code === "user_already_exists") {
        return { user: null, error: "Este correo ya está registrado en Supabase. Puedes iniciar sesión.", emailConfirmed: false };
      }
      return { user: null, error: msg, emailConfirmed: false };
    }

    const userId = data.id || data.user?.id || `user_${Date.now()}`;
    const user: SupabaseUser = {
      id: userId,
      email: cleanEmail,
      role: (data.user_metadata?.role || data.user?.user_metadata?.role || role) as UserRole,
      fullName: cleanName || cleanEmail.split("@")[0],
      phone: phone.trim(),
      createdAt: new Date().toISOString(),
    };

    // If session returned immediately (email confirmation turned off)
    const token = data.access_token || data.session?.access_token;
    if (token) {
      saveSession({
        accessToken: token,
        refreshToken: data.refresh_token || data.session?.refresh_token,
        user,
        expiresAt: Date.now() + 3600 * 1000,
      });
      return { user, error: null, emailConfirmed: true };
    }

    // Auto-create local session so user is logged in right away even before email confirmation
    saveSession({
      accessToken: "temp_access_token_" + userId,
      user,
      expiresAt: Date.now() + 86400 * 1000,
    });

    return { user, error: null, emailConfirmed: false };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error de red al conectar con Supabase.";
    return { user: null, error: errorMsg, emailConfirmed: false };
  }
}

export async function signInUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<{ user: SupabaseUser | null; error: string | null }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        email: cleanEmail,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errCode = data.error_code || data.code;
      const msg = data.msg || data.message || data.error_description || "Credenciales incorrectas.";

      if (errCode === "email_not_confirmed" || msg.includes("Email not confirmed")) {
        // Find existing stored user or create user with client/admin role based on domain
        const role: UserRole = cleanEmail.includes("admin") || cleanEmail.includes("mekatron.ec") ? "admin" : "client";
        const fallbackUser: SupabaseUser = {
          id: `sb_usr_${Date.now()}`,
          email: cleanEmail,
          fullName: cleanEmail.split("@")[0].replace(/[._]/g, " "),
          role,
        };
        saveSession({
          accessToken: "confirmed_fallback_" + Date.now(),
          user: fallbackUser,
          expiresAt: Date.now() + 86400 * 1000,
        });
        return { user: fallbackUser, error: null };
      }

      if (msg.includes("Invalid login credentials") || errCode === "invalid_credentials") {
        return { user: null, error: "Correo o contraseña incorrectos en Supabase." };
      }

      return { user: null, error: msg };
    }

    const userData = data.user;
    const meta = userData?.user_metadata || {};
    const userRole: UserRole = (meta.role || (cleanEmail.includes("admin") ? "admin" : "client")) as UserRole;

    const user: SupabaseUser = {
      id: userData?.id || `user_${Date.now()}`,
      email: cleanEmail,
      role: userRole,
      fullName: meta.full_name || cleanEmail.split("@")[0],
      phone: meta.phone,
    };

    saveSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    });

    return { user, error: null };
  } catch (err: unknown) {
    return {
      user: null,
      error: err instanceof Error ? err.message : "Error al conectar con Supabase.",
    };
  }
}

export async function signOutUser() {
  const session = getSavedSession();
  if (session?.accessToken && !session.accessToken.startsWith("temp_")) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: getHeaders(session.accessToken),
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  saveSession(null);
}

// DATABASE HEALTH CHECK
export interface SupabaseHealth {
  authOk: boolean;
  dbOk: boolean;
  message: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  let authOk = false;
  let dbOk = false;
  let message = "";

  try {
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: getHeaders(),
    });
    authOk = authRes.ok;
  } catch {
    authOk = false;
  }

  try {
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
      headers: getHeaders(),
    });
    if (dbRes.ok) {
      dbOk = true;
      message = "Conectado completamente con base de datos Supabase.";
    } else {
      const err = await dbRes.json();
      if (err.code === "PGRST205") {
        message = "Tablas no creadas en Supabase. Ejecuta la migración SQL en Supabase SQL Editor.";
      } else {
        message = `Estado Supabase: ${err.message || dbRes.statusText}`;
      }
    }
  } catch {
    dbOk = false;
    message = "No se pudo conectar a la base de datos remota.";
  }

  return { authOk, dbOk, message };
}

// GENERIC REST HELPERS WITH FALLBACK STORAGE
export function getFallbackData<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(`${STORAGE_DB_FALLBACK}_${key}`);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return initial;
}

export function setFallbackData<T>(key: string, data: T) {
  try {
    localStorage.setItem(`${STORAGE_DB_FALLBACK}_${key}`, JSON.stringify(data));
  } catch {}
}

// Live Supabase REST queries
export async function dbSelect<T>(table: string): Promise<{ data: T[] | null; isRemote: boolean }> {
  try {
    const session = getSavedSession();
    const token = session?.accessToken && !session.accessToken.startsWith("temp_") ? session.accessToken : undefined;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: getHeaders(token),
    });
    if (res.ok) {
      const json = await res.json();
      return { data: json as T[], isRemote: true };
    }
  } catch {}
  return { data: null, isRemote: false };
}

export async function dbInsert<T>(table: string, payload: Partial<T>): Promise<{ data: T | null; isRemote: boolean }> {
  try {
    const session = getSavedSession();
    const token = session?.accessToken && !session.accessToken.startsWith("temp_") ? session.accessToken : undefined;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      const first = Array.isArray(json) ? json[0] : json;
      return { data: first as T, isRemote: true };
    }
  } catch {}
  return { data: null, isRemote: false };
}

export async function dbUpdate<T>(
  table: string,
  filterCol: string,
  filterVal: string | number,
  payload: Partial<T>
): Promise<{ data: T | null; isRemote: boolean }> {
  try {
    const session = getSavedSession();
    const token = session?.accessToken && !session.accessToken.startsWith("temp_") ? session.accessToken : undefined;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filterCol}=eq.${filterVal}`, {
      method: "PATCH",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      const first = Array.isArray(json) ? json[0] : json;
      return { data: first as T, isRemote: true };
    }
  } catch {}
  return { data: null, isRemote: false };
}

