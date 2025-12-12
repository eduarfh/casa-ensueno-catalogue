try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Si recibimos session inmediatamente, redirigimos.
  if (data?.session) {
    toast({ title: "Inicio de sesión exitoso", description: "Redirigiendo al dashboard..." });
    router.push("/admin");
    return;
  }

  // Si no hay session inmediata, esperamos al evento "SIGNED_IN" (fallback)
  const TIMEOUT_MS = 5000;
  let resolved = false;

  const { data: subData } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      resolved = true;
      toast({ title: "Inicio de sesión exitoso", description: "Redirigiendo al dashboard..." });
      router.push("/admin");
    }
  });

  // Espera corta por si la sesión llega. Si no llega, mostramos error.
  await new Promise((res) => setTimeout(res, TIMEOUT_MS));
  // cleanup subscription
  subData?.subscription?.unsubscribe?.();

  if (!resolved) {
    throw new Error("No se pudo establecer la sesión tras iniciar sesión. Intenta recargar.");
  }
}
