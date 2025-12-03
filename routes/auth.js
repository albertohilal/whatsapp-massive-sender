const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.post('/login', authController.login);

// Endpoint para cerrar sesión
router.post('/logout', (req, res) => {
	if (req.session) {
		req.session.destroy((err) => {
			if (err) {
				return res.status(500).json({ 
					ok: false, 
					error: 'Error al cerrar sesión' 
				});
			}
			res.clearCookie('connect.sid'); // Limpiar cookie de sesión
			return res.json({ 
				ok: true, 
				message: 'Sesión cerrada exitosamente' 
			});
		});
	} else {
		res.json({ ok: true, message: 'No había sesión activa' });
	}
});

// Endpoint para obtener el usuario logueado
router.get('/usuario-logueado', (req, res) => {
	if (req.session && req.session.usuario) {
		return res.json({ 
			usuario: req.session.usuario,
			tipo: req.session.tipo || 'cliente',
			cliente_id: req.session.cliente_id
		});
	}
	res.json({ usuario: null });
});

// Endpoint para iniciar WhatsApp bajo demanda
const { iniciarCliente } = require('../bot/whatsapp_instance');
router.post('/iniciar-whatsapp', (req, res) => {
	try {
		if (typeof iniciarCliente === 'function') {
			iniciarCliente();
			return res.json({ ok: true, message: 'WhatsApp iniciado correctamente.' });
		}
		res.status(500).json({ ok: false, error: 'No se pudo iniciar el cliente WhatsApp.' });
	} catch (err) {
		res.status(500).json({ ok: false, error: err.message });
	}
});

module.exports = router;
