import { supabase, toAppUser } from '../lib/supabaseClient';

// Módulo 01 — Autenticación SUPABASE-ONLY (Opción A: Auth nativo).
// Misma firma que el AuthAPI Spring para no romper páginas.
// Login acepta username o email: si no tiene @, busca email en profiles.

async function emailFromUsername(username) {
  if (username.includes('@')) return username;
  // Usa rpc seguro (anon no puede leer profiles directo por RLS).
  // Requiere supabase/07_fix_login.sql ejecutado. Fallback a lectura directa
  // por si el proyecto aún no tiene la función.
  const { data, error } = await supabase.rpc('email_for_username', { p_username: username });
  if (!error && data) return data;
  const res = await supabase.from('profiles').select('email').eq('username', username).single();
  if (res.error || !res.data?.email) throw new Error('Usuario o contraseña incorrectos.');
  return res.data.email;
}

export const AuthAPI = {
  login: async (username, password) => {
    const email = await emailFromUsername(username.trim());
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (/email not confirmed/i.test(error.message)) {
        throw new Error('Email sin confirmar. Desactiva "Confirm email" en Auth > Providers o confirma el correo.');
      }
      throw new Error('Usuario o contraseña incorrectos.');
    }
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, username, email, rol, asociado_id, activo')
      .eq('id', data.user.id)
      .single();
    if (pErr || !profile) {
      await supabase.auth.signOut();
      throw new Error('Perfil no encontrado. Pide al admin que vincule tu cuenta.');
    }
    if (profile.activo === false) {
      await supabase.auth.signOut();
      throw new Error('Cuenta bloqueada. Contacta al administrador.');
    }
    await supabase
      .from('profiles')
      .update({ ultimo_login: new Date().toISOString() })
      .eq('id', data.user.id);
    return { usuario: toAppUser(profile), session: data.session };
  },

  logout: async () => {
    await supabase.auth.signOut();
    return true;
  },

  refresh: async () => {
    const { data } = await supabase.auth.refreshSession();
    return data.session;
  },

  crearUsuario: async ({ username, password, email, contacto, rol, asociadoId }) => {
    if (!username || !password || !rol) throw new Error('Faltan campos obligatorios.');
    if (password.length < 8) throw new Error('La contraseña debe tener mínimo 8 caracteres.');
    // El formulario manda `contacto` (correo o teléfono). Supabase Auth exige email:
    // si el contacto no es email, se genera uno técnico y se avisa en la respuesta.
    const contactoTxt = (email || contacto || '').trim();
    let emailFinal = contactoTxt.includes('@') ? contactoTxt : `${username.trim().toLowerCase().replace(/\s+/g, '.')}@cuenta.local`;
    let emailTecnico = !contactoTxt.includes('@');
    // Regla de roles: TESORERO solo crea ASOCIADO (la UI ya lo limita, esto lo blinda).
    const { data: { user: yo } } = await supabase.auth.getUser();
    const { data: miPerfil } = await supabase.from('profiles').select('rol').eq('id', yo?.id || '').single();
    const miRol = miPerfil?.rol;
    if (!miRol || !(miRol === 'ADMINISTRADOR' || (miRol === 'TESORERO' && rol === 'ASOCIADO'))) {
      throw new Error('No tienes permiso para crear ese rol.');
    }
    if (rol === 'ASOCIADO' && !asociadoId) throw new Error('Debes vincular un asociado.');
    // Guarda la sesión del admin: con confirm-email desactivado el signUp
    // inicia sesión como el nuevo usuario; al final la restauramos.
    const { data: { session: sesionAdmin } } = await supabase.auth.getSession();
    const { data: sign, error } = await supabase.auth.signUp({
      email: emailFinal,
      password,
      options: {
        data: { username, rol },
        // El enlace de confirmación abre la app real, no localhost del Site URL.
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw new Error(error.message);
    const userId = sign.user?.id;
    if (!userId) {
      if (sesionAdmin) await supabase.auth.setSession(sesionAdmin).catch(() => {});
      throw new Error('No se pudo crear la cuenta (¿email ya existe?).');
    }
    // Re-autentica como admin para insertar el perfil (requiere ser staff por RLS).
    if (sesionAdmin) await supabase.auth.setSession(sesionAdmin).catch(() => {});
    const { error: pErr } = await supabase.from('profiles').insert({
      id: userId,
      username: username.trim(),
      email: emailFinal,
      rol,
      asociado_id: asociadoId || null,
      activo: true,
    });
    if (pErr) throw new Error('Cuenta auth creada pero falló perfil: ' + pErr.message);
    return { id: userId, username, email: emailFinal, rol, asociadoId: asociadoId || null, emailTecnico };
  },

  perfil: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sin sesión.');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, rol, asociado_id, activo')
      .eq('id', user.id)
      .single();
    if (error) throw new Error('Perfil no encontrado.');
    return toAppUser(data);
  },

  cambiarPassword: async ({ passwordNueva, password }) => {
    const nuevo = passwordNueva || password;
    if (!nuevo || nuevo.length < 8) throw new Error('La nueva contraseña debe tener mínimo 8 caracteres.');
    const { error } = await supabase.auth.updateUser({ password: nuevo });
    if (error) throw new Error(error.message);
    return true;
  },

  // Re-verifica la contraseña del admin autenticado antes de acciones
  // destructivas (borrados). Devuelve true si el re-login funciona.
  verificarPassword: async (password) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sin sesión activa.');
    // Preferimos email del auth.user; si no, el del perfil.
    let email = user.email;
    if (!email) {
      const { data } = await supabase.from('profiles').select('email').eq('id', user.id).single();
      email = data?.email || null;
    }
    if (!email) throw new Error('Tu cuenta no tiene email configurado; no se puede verificar la contraseña.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Contraseña incorrecta.');
    return true;
  },

  listarUsuarios: async () => {    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, email, rol, asociado_id, activo, motivo_bloqueo')
      .order('username');
    if (error) throw new Error(error.message);
    return (data || []).map((p) => ({
      id: p.id,
      username: p.username,
      email: p.email,
      rol: p.rol,
      asociadoId: p.asociado_id,
      activo: p.activo,
      motivoBloqueo: p.motivo_bloqueo,
    }));
  },

  cambiarEstadoUsuario: async (id, _password, motivo) => {
    // Activa/bloquea alternando: si está activo lo bloquea, si no lo reactiva.
    const { data: actual, error: gErr } = await supabase
      .from('profiles')
      .select('activo')
      .eq('id', id)
      .single();
    if (gErr) throw new Error('Usuario no encontrado.');
    const { error } = await supabase
      .from('profiles')
      .update({ activo: !actual.activo, motivo_bloqueo: motivo || null })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  editarPerfilDatos: async (payload) => {
    // Solo si configuracion.edicion_asociados_activa y campos permitidos
    const { data: conf } = await supabase
      .from('configuracion')
      .select('edicion_asociados_activa')
      .eq('id', 1)
      .single();
    if (conf && conf.edicion_asociados_activa === false) {
      throw new Error('La edición de datos está desactivada por el administrador.');
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: prof } = await supabase
      .from('profiles')
      .select('asociado_id')
      .eq('id', user.id)
      .single();
    if (!prof?.asociado_id) throw new Error('Tu cuenta no tiene asociado vinculado.');
    const permitido = {};
    for (const k of ['telefono_principal', 'telefono_alternativo', 'correo', 'direccion', 'barrio_vereda']) {
      const camel = { telefono_principal: 'telefonoPrincipal', telefono_alternativo: 'telefonoAlternativo', correo: 'correo', direccion: 'direccion', barrio_vereda: 'barrioVereda' }[k];
      if (payload[k] !== undefined) permitido[k] = payload[k];
      else if (payload[camel] !== undefined) permitido[k] = payload[camel];
    }
    const { error } = await supabase
      .from('asociados')
      .update(permitido)
      .eq('id', prof.asociado_id);
    if (error) throw new Error(error.message);
    return true;
  },
};

export const ROLES = ['ASOCIADO', 'TESORERO', 'ADMINISTRADOR'];

export const ROLES_QUE_PUEDE_CREAR = {
  ADMINISTRADOR: ['TESORERO', 'ADMINISTRADOR', 'ASOCIADO'],
  TESORERO: ['ASOCIADO'],
};
