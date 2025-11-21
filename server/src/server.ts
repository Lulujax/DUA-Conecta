import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend'; // 🚨 ¡Recuerda instalar! npm install resend

// --- CONFIGURACIÓN DE SEGURIDAD (LEYENDO DESDE EL ENTORNO) ---
// ⚠️ ADVERTENCIA DE SEGURIDAD: La clave '1234' es muy insegura. 
// Por favor, CÁMBIALA por una frase larga y aleatoria en tus variables de entorno.
const JWT_SECRET = process.env.JWT_SECRET || 'CLAVE_SECRETA_DE_FALLBACK'; 
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Esta URL DEBE SER la dirección pública de tu frontend (ej: https://tueditor.vercel.app)
const FRONTEND_PUBLIC_URL = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173'; 

// La URL de tu base de datos (solo para referencia, no usada directamente aquí)
const DATABASE_URL = process.env.DATABASE_URL; 

// --- CONFIGURACIÓN DE CORREO ELECTRÓNICO (RESEND) ---
const resend = new Resend(RESEND_API_KEY);

// Función de envío de email usando Resend
async function sendEmail(to: string, subject: string, html: string) {
    const fromEmail = 'onboarding@resend.dev'; // Remitente por defecto de Resend
    
    return resend.emails.send({
        from: `DUA Conecta <${fromEmail}>`,
        to: [to],
        subject: subject,
        html: html,
    });
}

// --- PLACEHOLDER DE BASE DE DATOS (REEMPLAZAR CON TU DB REAL) ---
// Array en memoria que debes reemplazar con una conexión real a PostgreSQL.
let users: Array<any> = [
    { id: 1, email: 'admin@example.com', passwordHash: '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', resetPasswordToken: undefined, resetPasswordExpires: undefined }
]; 

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ----------------------------------------------------------------------
//                        1. BÚSQUEDA DE IMÁGENES (PIXABAY)
// ----------------------------------------------------------------------

app.get('/api/search-images', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'El parámetro de búsqueda (query) es requerido.' });
    }
    
    if (!PIXABAY_API_KEY || PIXABAY_API_KEY.length < 10) {
         return res.status(500).json({ error: 'Pixabay API Key no configurada. Revisa tus variables de entorno en Render.' });
    }

    try {
        const response = await axios.get('https://pixabay.com/api/', {
            params: {
                key: PIXABAY_API_KEY,
                q: query,
                image_type: 'photo',
                safesearch: true,
                per_page: 20
            }
        });
        
        const imageUrls = response.data.hits.map((hit: any) => hit.webformatURL);

        res.json({ success: true, images: imageUrls });
    } catch (error) {
        console.error('Pixabay API error:', (error as any).message);
        res.status(500).json({ error: 'Error al buscar imágenes. Revisa la conexión de tu servidor a la API externa.' });
    }
});


// ----------------------------------------------------------------------
//                       2. RECUPERACIÓN DE CONTRASEÑA
// ----------------------------------------------------------------------

// 2.1. Ruta para solicitar el enlace de recuperación
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    // Simulación: Buscar usuario en la DB
    const user = users.find(u => u.email === email);
    const genericResponse = { message: 'Si el correo existe, se ha enviado un enlace de recuperación.' };

    if (!user) {
        return res.json(genericResponse);
    }
    
    if (!RESEND_API_KEY) {
        console.error("RESEND_API_KEY NO ESTÁ CONFIGURADA. No se puede enviar email.");
        return res.status(500).json({ error: 'Error interno: Servicio de correo no configurado.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const tokenExpires = Date.now() + 3600000; // 1 hora de validez
    
    // Simulación: Guardar token y expiración en el DB
    user.resetPasswordToken = token;
    user.resetPasswordExpires = tokenExpires;
    
    // Usamos la URL pública configurada en el entorno para construir el enlace
    const resetURL = `${FRONTEND_PUBLIC_URL}/auth/reset-password?token=${token}`; 

    try {
        await sendEmail(
            user.email,
            'Recuperación de Contraseña DUA-Conecta',
            `<p>Haz clic en este enlace para restablecer tu contraseña:</p><a href="${resetURL}">${resetURL}</a><p>El enlace expira en 1 hora.</p>`
        );
        console.log(`[PASS RESET] Enlace enviado a ${email}: ${resetURL}`);
        
    } catch (e) {
        console.error("Error al enviar email de recuperación:", e);
    }

    res.json(genericResponse);
});

// 2.2. Ruta para restablecer la contraseña
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    // Simulación: Buscar usuario por token válido
    const user = users.find(u => u.resetPasswordToken === token && u.resetPasswordExpires > Date.now());

    if (!user) {
        return res.status(400).json({ error: 'El enlace de recuperación no es válido o ha expirado.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    // Hashear y actualizar contraseña
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Limpiar campos de token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // *** Aquí iría tu lógica de actualización de usuario en la DB real usando el DATABASE_URL ***

    res.json({ success: true, message: 'Contraseña restablecida con éxito. Ya puedes iniciar sesión.' });
});

// ----------------------------------------------------------------------
//                       3. ASEGURAR MULTIUSUARIO (AUTH GENÉRICA)
// ----------------------------------------------------------------------

// Middleware para validar tokens JWT
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ error: 'Token de autorización faltante.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); 
        (req as any).user = decoded; 
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
    }
};

// ... (otras rutas de tu app que usan requireAuth)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});