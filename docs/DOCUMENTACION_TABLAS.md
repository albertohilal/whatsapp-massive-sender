# Diferenciación de Tablas: Usuarios Internos vs Leads/Clientes Externos

## Resumen
En este sistema, es fundamental mantener una clara separación entre los usuarios internos (quienes gestionan y acceden al sistema) y los leads/clientes externos (contactos gestionados para campañas, ventas o CRM).

| Tabla           | Propósito                                 |
|-----------------|-------------------------------------------|
| ll_usuarios     | Usuarios internos (acceso, gestión)       |
| llxbx_societe   | Leads/clientes externos (CRM, campañas)   |

---

## Detalle de cada tabla

### ll_usuarios
- **¿Quiénes son?** Personas que acceden al sistema: administradores, operadores, agentes de marketing, usuarios de Haby, usuarios de Desarrollo y Diseño, etc.
- **Campos típicos:** id, nombre, email, contraseña, rol, permisos, etc.
- **Uso:** Control de acceso, autenticación, autorización, registro de actividad de usuarios internos.

### llxbx_societe
- **¿Quiénes son?** Leads, clientes, empresas o contactos externos que se gestionan en Dolibarr.
- **Campos típicos:** id, nombre de empresa, teléfono, dirección, ref_ext, etc.
- **Uso:** Gestión comercial, campañas, CRM, seguimiento de leads, asignación a campañas/clientes.

---

## Buenas prácticas para mantener la separación
- Nunca mezclar datos de usuarios internos con leads/clientes externos.
- Los scripts de importación, sincronización y asignación deben trabajar solo con `llxbx_societe` para leads/clientes y con `ll_usuarios` para autenticación, permisos y gestión interna.
- Si algún proceso requiere distinguir entre un usuario y un lead, valida siempre contra la tabla correcta.
- Si necesitas relacionar un usuario con un lead (por ejemplo, para asignar un responsable), usa una tabla de relación específica, nunca mezcles los datos en la misma tabla.
- En la interfaz de usuario, asegúrate de que los usuarios internos solo gestionen lo que corresponde a su rol y nunca puedan confundirse con los leads/clientes.

---

## Ejemplo de validación en código (Node.js)

```js
// Validar si un email corresponde a un usuario interno
const [usuarios] = await connection.execute('SELECT * FROM ll_usuarios WHERE email = ?', [email]);
if (usuarios.length > 0) {
  // Es usuario interno
}

// Validar si un teléfono corresponde a un lead/cliente externo
const [leads] = await connection.execute('SELECT * FROM llxbx_societe WHERE phone_mobile = ?', [telefono]);
if (leads.length > 0) {
  // Es lead/cliente externo
}
```

---

Mantener esta separación es clave para la seguridad, la claridad y la escalabilidad del sistema.