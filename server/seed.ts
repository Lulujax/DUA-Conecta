import postgres from 'postgres'

// --- 1. CARGAR VARIABLES DE ENTORNO ---
const envFile = Bun.file('.env');
if (await envFile.exists()) {
    const text = await envFile.text();
    for (const line of text.split('\n')) {
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] ? match[2].trim() : '';
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[match[1]] = value;
        }
    }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("❌ Error: No se encontró DATABASE_URL.");
    process.exit(1);
}

const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
console.log(`🔌 Conectando a ${isLocal ? 'Localhost' : 'Render'}...`);

const sql = postgres(dbUrl, { 
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 1,
    idle_timeout: 20,
    connect_timeout: 60 
});

console.log("🌱 Restaurando TODAS las plantillas (Centradas y Corregidas)...");

// =====================================================================
//  HELPERS DE DISEÑO (ENCABEZADOS Y PIES)
// =====================================================================

// Encabezado Español
const createHeader = () => [
    { id: 5001, type: 'text', content: 'Nombre:', x: 40, y: 40, width: 70, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5002, type: 'text', content: '_______________________', x: 115, y: 40, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5003, type: 'text', content: 'Fecha:', x: 330, y: 40, width: 60, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5004, type: 'text', content: '___________', x: 390, y: 40, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5005, type: 'text', content: 'Grado:', x: 510, y: 40, width: 60, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5006, type: 'text', content: '_______', x: 570, y: 40, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 }
];

// Encabezado Inglés
const createHeaderEN = () => [
    { id: 5001, type: 'text', content: 'Name:', x: 40, y: 40, width: 60, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5002, type: 'text', content: '_______________________', x: 105, y: 40, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5003, type: 'text', content: 'Date:', x: 320, y: 40, width: 50, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5004, type: 'text', content: '___________', x: 375, y: 40, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5005, type: 'text', content: 'Grade:', x: 500, y: 40, width: 60, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5006, type: 'text', content: '_______', x: 565, y: 40, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 }
];

// Pie de página
const createFooter = (y) => [
    { id: 5998, type: 'text', content: '¡Gana tu ficha aquí!', x: 400, y: y, width: 150, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', z: 1 },
    { id: 5999, type: 'text', content: '____________', x: 560, y: y, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 }
];

// --- HELPER: BLOQUE MATEMÁTICO ---
const mkMathBlock = (idBase, x, y, n1, n2, operator, width = 140, fontSize = 35) => {
    const height = 140;
    const lineY = y + 90; 
    const paddingRight = 30;
    return [
        { id: idBase, type: 'shape', shapeType: 'rectangle', x: x, y: y, width: width, height: height, stroke: '#000000', strokeWidth: 3, fill: 'transparent', z: 1 },
        { id: idBase + 1, type: 'shape', shapeType: 'line', x: x, y: lineY, width: width, height: 2, stroke: '#000000', strokeWidth: 2, z: 2 },
        { id: idBase + 2, type: 'text', content: n1, x: x, y: y + 10, width: width - paddingRight, height: 45, fontSize: fontSize, textAlign: 'right', fontFamily: 'Arial', z: 3 },
        { id: idBase + 3, type: 'text', content: operator, x: x + 15, y: y + 50, width: 20, height: 40, fontSize: fontSize, textAlign: 'left', fontFamily: 'Arial', z: 3 },
        { id: idBase + 4, type: 'text', content: n2, x: x, y: y + 50, width: width - paddingRight, height: 45, fontSize: fontSize, textAlign: 'right', fontFamily: 'Arial', z: 3 },
    ];
};

// --- HELPER: DEDOS ---
const mkFingerBlock = (idBase, x, y, imgName) => {
    const handW = 100; const handH = 140;
    const boxSize = 70; const gap = 10;
    const handX = x + 10; const box1X = x + 130; const box2X = box1X + boxSize + gap;
    return [
        { id: idBase, type: 'image', url: `/${imgName}`, x: handX, y: y + 10, width: handW, height: handH, z: 1 },
        { id: idBase + 1, type: 'shape', shapeType: 'rectangle', x: box1X, y: y + 20, width: boxSize, height: 60, stroke: '#000', strokeWidth: 2, fill: 'transparent', z: 1 },
        { id: idBase + 2, type: 'shape', shapeType: 'rectangle', x: box2X, y: y + 20, width: boxSize, height: 60, stroke: '#000', strokeWidth: 2, fill: 'transparent', z: 1 },
        { id: idBase + 3, type: 'shape', shapeType: 'rectangle', x: box1X, y: y + 90, width: (boxSize * 2) + gap, height: 50, stroke: '#000', strokeWidth: 2, fill: 'transparent', z: 1 },
        { id: idBase + 4, type: 'text', content: '', x: box1X, y: y + 30, width: boxSize, height: 40, fontSize: 32, textAlign: 'center', z: 2 },
        { id: idBase + 5, type: 'text', content: '', x: box2X, y: y + 30, width: boxSize, height: 40, fontSize: 32, textAlign: 'center', z: 2 },
        { id: idBase + 6, type: 'text', content: '', x: box1X, y: y + 100, width: (boxSize * 2) + gap, height: 30, fontSize: 20, textAlign: 'center', z: 2 },
    ];
};

// --- HELPER: RELOJ ANALÓGICO ---
const mkClockBlock = (idBase, x, y) => {
    const size = 120;
    const center = size / 2;
    return [
        { id: idBase, type: 'shape', shapeType: 'circle', x: x, y: y, width: size, height: size, stroke: '#000', strokeWidth: 3, fill: 'transparent', z: 1 },
        { id: idBase+1, type: 'shape', shapeType: 'circle', x: x + center - 3, y: y + center - 3, width: 6, height: 6, stroke: '#000', fill: '#000', z: 2 },
        { id: idBase+2, type: 'shape', shapeType: 'line', x: x + center, y: y + 5, width: 0, height: 10, stroke: '#000', strokeWidth: 2, z: 2 }, 
        { id: idBase+3, type: 'shape', shapeType: 'line', x: x + center, y: y + size - 15, width: 0, height: 10, stroke: '#000', strokeWidth: 2, z: 2 }, 
        { id: idBase+4, type: 'shape', shapeType: 'line', x: x + 5, y: y + center, width: 10, height: 0, stroke: '#000', strokeWidth: 2, z: 2 }, 
        { id: idBase+5, type: 'shape', shapeType: 'line', x: x + size - 15, y: y + center, width: 10, height: 0, stroke: '#000', strokeWidth: 2, z: 2 }, 
        { id: idBase+6, type: 'shape', shapeType: 'rectangle', x: x + 10, y: y + size + 10, width: 100, height: 40, stroke: '#000', strokeWidth: 2, fill: 'transparent', z: 1 },
        { id: idBase+7, type: 'text', content: ':', x: x + 55, y: y + size + 15, width: 10, height: 30, fontSize: 24, isBold: true, textAlign: 'center', z: 2 }
    ];
};

// --- HELPER: CAJA DE SECUENCIA ---
const mkSequenceStep = (idBase, x, y, title) => {
    const boxW = 150; 
    const boxH = 180;
    return [
        { id: idBase, type: 'text', content: title, x: x, y: y, width: boxW, height: 30, fontSize: 16, isBold: true, textAlign: 'center', z: 1 },
        { id: idBase+1, type: 'shape', shapeType: 'rectangle', x: x, y: y + 35, width: boxW, height: boxH, stroke: '#333', strokeWidth: 2, fill: 'transparent', z: 1 },
        { id: idBase+2, type: 'shape', shapeType: 'line', x: x + 10, y: y + boxH - 30, width: boxW - 20, height: 1, stroke: '#999', strokeWidth: 1, z: 1 },
        { id: idBase+3, type: 'shape', shapeType: 'line', x: x + 10, y: y + boxH - 60, width: boxW - 20, height: 1, stroke: '#999', strokeWidth: 1, z: 1 },
    ];
};

// --- HELPER: CHECKLIST ---
const mkCheckItem = (idBase, x, y) => {
    return [
        { id: idBase, type: 'shape', shapeType: 'rectangle', x: x, y: y, width: 40, height: 40, stroke: '#000', strokeWidth: 3, fill: 'transparent', z: 1 },
        { id: idBase+1, type: 'shape', shapeType: 'line', x: x + 60, y: y + 35, width: 500, height: 2, stroke: '#000', strokeWidth: 2, z: 1 },
    ];
};


// =====================================================================
//  DEFINICIÓN DE LAS PLANTILLAS
// =====================================================================

// 1. MONSTRUO
const monstruoElements = [
    ...createHeader(),
    { id: 4, type: 'text', content: 'El Monstruo de las Emociones', x: 40, y: 80, width: 620, height: 35, fontSize: 24, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 6, type: 'text', content: 'El monstruo siente muchas emociones, dice que en cada parte de su cuerpo hay una emoción ¿En qué parte del cuerpo sientes la emoción?', x: 40, y: 130, width: 620, height: 40, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 7, type: 'text', content: 'COLORES Y EMOCIONES:', x: 40, y: 190, width: 600, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 8, type: 'text', content: '• ROJO - IRA/MOLESTIA', x: 60, y: 220, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 9, type: 'text', content: '• MORADO - MIEDO', x: 60, y: 240, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 10, type: 'text', content: '• AZUL - TRISTEZA', x: 60, y: 260, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 11, type: 'text', content: '• AMARILLO - FELICIDAD', x: 60, y: 280, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 12, type: 'text', content: '• VERDE - ASCO', x: 60, y: 300, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 5, type: 'image', url: '/asdasda-removebg-preview.png', x: 200, y: 360, width: 300, height: 300, z: 1},
    ...createFooter(920)
];

// 2. LUPA
const lupaElements = [
    { id: 1, type: 'text', content: 'EMOCIONES CON LUPA', x: 40, y: 40, width: 400, height: 40, fontSize: 28, color: '#3D246C', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1},
    ...createHeader(), 
    { id: 4, type: 'text', content: 'Lee con atención cada situación. Une con una flecha la emoción que crees que encaja mejor.', x: 40, y: 110, width: 620, height: 50, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 10, type: 'image', url: '/emocion-verguenza.png', x: 60, y: 180, width: 100, height: 80, z: 1}, { id: 11, type: 'text', content: 'VERGÜENZA', x: 60, y: 265, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 12, type: 'text', content: 'La profe explicó el ejercicio, pero no entendí qué tenía que hacer.', x: 250, y: 210, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 20, type: 'image', url: '/emocion-orgullo.png', x: 60, y: 300, width: 100, height: 80, z: 1}, { id: 21, type: 'text', content: 'ORGULLO', x: 60, y: 385, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 22, type: 'text', content: 'Quería explicar mi idea, pero nadie me escuchaba.', x: 250, y: 330, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 30, type: 'image', url: '/emocion-calma.png', x: 60, y: 420, width: 100, height: 80, z: 1}, { id: 31, type: 'text', content: 'CALMA', x: 60, y: 505, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 32, type: 'text', content: 'Se me olvidó lo que iba a decir en voz alta y todos me miraron.', x: 250, y: 450, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 40, type: 'image', url: '/emocion-confusion.png', x: 60, y: 540, width: 100, height: 80, z: 1}, { id: 41, type: 'text', content: 'CONFUSIÓN', x: 60, y: 625, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 42, type: 'text', content: 'Prometí ir al cumpleaños, pero me olvidé y no fui.', x: 250, y: 570, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 50, type: 'image', url: '/emocion-culpa.png', x: 60, y: 660, width: 100, height: 80, z: 1}, { id: 51, type: 'text', content: 'CULPA', x: 60, y: 745, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 52, type: 'text', content: 'Aprendí a montar en bici sin ayuda y me sentí muy feliz.', x: 250, y: 690, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 60, type: 'image', url: '/emocion-frustracion.png', x: 60, y: 780, width: 100, height: 80, z: 1}, { id: 61, type: 'text', content: 'FRUSTRACIÓN', x: 60, y: 865, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 62, type: 'text', content: 'Estaba pintando sin prisa, con música bajita, y me sentía en paz.', x: 250, y: 810, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    ...createFooter(920)
];

// 3. AYUDA
const c1_img = 40; const c1_txt = 190; const c2_img = 360; const c2_txt = 510; const lineW = 150;
const ayudaElements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¿COMO TE AYUDO?', x: 40, y: 80, width: 620, height: 40, fontSize: 36, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 5, type: 'text', content: 'Según lo que ves en la imagen ¿Qué le sucede? o ¿Cómo podemos ayudarlo?', x: 40, y: 130, width: 620, height: 40, fontSize: 16, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 10, type: 'image', url: '/situacion-pelea.png', x: c1_img, y: 200, width: 140, height: 100, z: 1}, { id: 11, type: 'text', content: '• _________________', x: c1_txt, y: 250, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 50, type: 'image', url: '/situacion-consola.png', x: c2_img, y: 200, width: 140, height: 100, z: 1}, { id: 51, type: 'text', content: '• _________________', x: c2_txt, y: 250, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 20, type: 'image', url: '/situacion-llora-solo.png', x: c1_img, y: 340, width: 140, height: 100, z: 1}, { id: 21, type: 'text', content: '• _________________', x: c1_txt, y: 390, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 60, type: 'image', url: '/situacion-bici.png', x: c2_img, y: 340, width: 140, height: 100, z: 1}, { id: 61, type: 'text', content: '• _________________', x: c2_txt, y: 390, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 30, type: 'image', url: '/situacion-quita-juguete.png', x: c1_img, y: 480, width: 140, height: 100, z: 1}, { id: 31, type: 'text', content: '• _________________', x: c1_txt, y: 530, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 70, type: 'image', url: '/situacion-resbala.png', x: c2_img, y: 480, width: 140, height: 100, z: 1}, { id: 71, type: 'text', content: '• _________________', x: c2_txt, y: 530, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 40, type: 'image', url: '/situacion-ayuda.png', x: c1_img, y: 620, width: 140, height: 100, z: 1}, { id: 41, type: 'text', content: '• _________________', x: c1_txt, y: 670, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 80, type: 'image', url: '/situacion-curita.png', x: c2_img, y: 620, width: 140, height: 100, z: 1}, { id: 81, type: 'text', content: '• _________________', x: c2_txt, y: 670, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    ...createFooter(780)
];

// 4. DADO
const CUBE_SIZE = 150; const ICON_SIZE = 100; const ICON_OFFSET = (CUBE_SIZE - ICON_SIZE) / 2;
const SOLAPA_W = 150; const SOLAPA_H = 50; const X_CENTER = 275; const Y_START_DADO = 250; 
const Y1 = Y_START_DADO, Y2 = Y1 + CUBE_SIZE, Y3 = Y2 + CUBE_SIZE, Y4 = Y3 + CUBE_SIZE;        
const X2 = X_CENTER, X1 = X2 - CUBE_SIZE, X3 = X2 + CUBE_SIZE;        

const dadoElements = [
    ...createHeader(),
    { id: 1, type: 'text', content: 'El Dado de las Historias', x: 40, y: 80, width: 620, height: 40, fontSize: 36, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 100},
    { id: 2, type: 'text', content: 'Instrucciones: Lanza el dado y crea una historia con el elemento que salga.', x: 40, y: 130, width: 620, height: 60, fontSize: 16, color: '#000000', textAlign: 'center', fontFamily: 'Arial', z: 100 },
    { id: 10, type: 'image', url: '/dado-naranja.png', x: X2, y: Y1, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
    { id: 11, type: 'image', url: '/dado-azul.png',    x: X2, y: Y2, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
    { id: 12, type: 'image', url: '/dado-rojo.png',    x: X2, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
    { id: 13, type: 'image', url: '/dado-cian.png',    x: X2, y: Y4, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
    { id: 14, type: 'image', url: '/dado-amarillo.png',x: X1, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
    { id: 15, type: 'image', url: '/dado-verde.png',   x: X3, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
    { id: 20, type: 'image', url: '/dado-icono-persona.png', x: X2 + ICON_OFFSET, y: Y1 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 21, type: 'image', url: '/dado-icono-lugar.png',   x: X2 + ICON_OFFSET, y: Y2 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 22, type: 'image', url: '/dado-icono-persona.png', x: X2 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 23, type: 'image', url: '/dado-icono-lugar.png',   x: X2 + ICON_OFFSET, y: Y4 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 24, type: 'image', url: '/dado-icono-objeto.png',  x: X1 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 25, type: 'image', url: '/dado-icono-objeto.png',  x: X3 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 30, type: 'image', url: '/dado-solapa.png', x: X2, y: Y1 - SOLAPA_H, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
    { id: 31, type: 'image', url: '/dado-solapa.png', x: X1, y: Y3 - SOLAPA_H, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
    { id: 32, type: 'image', url: '/dado-solapa.png', x: X3, y: Y3 - SOLAPA_H, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
    { id: 33, type: 'image', url: '/dado-solapa.png', x: X2, y: Y4 + CUBE_SIZE, width: SOLAPA_W, height: SOLAPA_H, rotation: 180, z: 3 },
    { id: 34, type: 'image', url: '/dado-solapa.png', x: X1 - (SOLAPA_W/2) - (SOLAPA_H/2), y: Y3 + (CUBE_SIZE/2) - (SOLAPA_H/2), width: SOLAPA_W, height: SOLAPA_H, rotation: 270, z: 3 }, 
    { id: 35, type: 'image', url: '/dado-solapa.png', x: X3 + (CUBE_SIZE/2) + (SOLAPA_H/2), y: Y3 + (CUBE_SIZE/2) - (SOLAPA_H/2), width: SOLAPA_W, height: SOLAPA_H, rotation: 90, z: 3 }, 
    { id: 36, type: 'image', url: '/dado-solapa.png', x: X2 - (SOLAPA_W/2) - (SOLAPA_H/2), y: Y4 + (CUBE_SIZE/2) - (SOLAPA_H/2), width: SOLAPA_W, height: SOLAPA_H, rotation: 270, z: 3 },
    { id: 37, type: 'image', url: '/dado-solapa.png', x: X2 + (CUBE_SIZE/2) + (SOLAPA_H/2), y: Y4 + (CUBE_SIZE/2) - (SOLAPA_H/2), width: SOLAPA_W, height: SOLAPA_H, rotation: 90, z: 3 },
    ...createFooter(900)
];

// 5. BINGO
const bingoY = 40; const gridYStart = 210; const rowH = 130; const gridW = 620; const gridX = 40;
const row1Y = gridYStart, row2Y = row1Y + rowH, row3Y = row2Y + rowH, row4Y = row3Y + rowH, row5Y = row4Y + rowH;
const colW = gridW / 5, textW = 110, txtOffX = (colW - textW) / 2, txtOffY = 82;
const tX1 = gridX + txtOffX, tX2 = tX1 + colW, tX3 = tX2 + colW, tX4 = tX3 + colW, tX5 = tX4 + colW;
const mkTxt = (id, x, y, txt='...') => ({ id: 2000 + id, type: 'text', content: txt, x, y: y + txtOffY, width: textW, height: 36, fontSize: 16, color: '#000', textAlign: 'center', fontFamily: 'Arial', z: 10 });

const bingoElements = [
    { id: 1, type: 'text', content: 'BINGO', x: 40, y: bingoY, width: 620, height: 130, fontSize: 95, color: '#000', isBold: true, textAlign: 'center', fontFamily: 'Anton', z: 2 },
    { id: 2, type: 'shape', shapeType: 'rectangle', x: 40, y: 210, width: 620, height: 35, fill: '#000', z: 2},
    { id: 3, type: 'text', content: 'EL PRIMERO QUE CANTE GANA', x: 40, y: 215, width: 620, height: 30, fontSize: 18, color: '#FFF', isBold: true, textAlign: 'center', fontFamily: 'Oswald', z: 3 },
    { id: 4, type: 'image', url: '/banderas-decoracion.png', x: 20, y: 40, width: 300, height: 60, rotation: -5, z: 1 },
    { id: 5, type: 'image', url: '/banderas-decoracion.png', x: 200, y: 30, width: 300, height: 60, rotation: 0, z: 1 },
    { id: 6, type: 'image', url: '/banderas-decoracion.png', x: 380, y: 40, width: 300, height: 60, rotation: 5, z: 1 },
    { id: 10, type: 'image', url: '/banderas-bingo-1.png', x: gridX, y: row1Y, width: gridW, height: rowH, z: 1 },
    { id: 11, type: 'image', url: '/banderas-bingo-2.png', x: gridX, y: row2Y, width: gridW, height: rowH, z: 1 },
    { id: 12, type: 'image', url: '/banderas-bingo-3.png', x: gridX, y: row3Y, width: gridW, height: rowH, z: 1 },
    { id: 13, type: 'image', url: '/banderas-bingo-4.png', x: gridX, y: row4Y, width: gridW, height: rowH, z: 1 },
    { id: 14, type: 'image', url: '/banderas-bingo-5.png', x: gridX, y: row5Y, width: gridW, height: rowH, z: 1 },
    mkTxt(100, tX1, row1Y), mkTxt(101, tX2, row1Y), mkTxt(102, tX3, row1Y), mkTxt(103, tX4, row1Y), mkTxt(104, tX5, row1Y),
    mkTxt(105, tX1, row2Y), mkTxt(106, tX2, row2Y), mkTxt(107, tX3, row2Y), mkTxt(108, tX4, row2Y), mkTxt(109, tX5, row2Y),
    mkTxt(110, tX1, row3Y), mkTxt(111, tX2, row3Y), { ...mkTxt(112, tX3, row3Y, 'PALABRA'), isBold: true, fontSize: 18 }, mkTxt(113, tX4, row3Y), mkTxt(114, tX5, row3Y),
    mkTxt(115, tX1, row4Y), mkTxt(116, tX2, row4Y), mkTxt(117, tX3, row4Y), mkTxt(118, tX4, row4Y), mkTxt(119, tX5, row4Y),
    mkTxt(120, tX1, row5Y), mkTxt(121, tX2, row5Y), mkTxt(122, tX3, row5Y), mkTxt(123, tX4, row5Y), mkTxt(124, tX5, row5Y),
    ...createFooter(910)
];

// 6. CONTEO (ES)
const conteoY = 180; const conteoH = 160; const col1_X = 40; const col2_X = 350; 
const c_r1 = conteoY; const c_r2 = c_r1 + conteoH; const c_r3 = c_r2 + conteoH; const c_r4 = c_r3 + conteoH; const c_r5 = c_r4 + conteoH;

const conteoSpanishElements = [
    ...createHeader(),
    { id: 1, type: 'text', content: 'Conteo con los dedos', x: 40, y: 90, width: 620, height: 40, fontSize: 36, isBold: true, textAlign: 'center', z: 10 },
    { id: 2, type: 'text', content: 'Cuenta, dibuja y escribe el número y la palabra.', x: 40, y: 130, width: 620, height: 30, fontSize: 16, textAlign: 'center', z: 10 },
    { id: 3, type: 'shape', shapeType: 'line', x: 40, y: 160, width: 620, height: 2, stroke: '#000', strokeWidth: 2, z: 1 },
    ...mkFingerBlock(100, col1_X, c_r1, 'mano_1.png'), ...mkFingerBlock(200, col2_X, c_r1, 'mano_5.png'),
    ...mkFingerBlock(300, col1_X, c_r2, 'mano_3.png'), ...mkFingerBlock(400, col2_X, c_r2, 'mano_7.png'),
    ...mkFingerBlock(500, col1_X, c_r3, 'mano_4.png'), ...mkFingerBlock(600, col2_X, c_r3, 'mano_10.png'),
    ...mkFingerBlock(700, col1_X, c_r4, 'mano_2.png'), ...mkFingerBlock(800, col2_X, c_r4, 'mano_8.png'),
    ...mkFingerBlock(900, col1_X, c_r5, 'mano_9.png'), ...mkFingerBlock(1000, col2_X, c_r5, 'mano_6.png'),
    ...createFooter(990)
];

// 7. CONTEO (EN)
const conteoEnglishElements = [
    ...createHeaderEN(),
    { id: 1, type: 'text', content: 'Finger Counting', x: 40, y: 90, width: 620, height: 40, fontSize: 36, isBold: true, textAlign: 'center', z: 10 },
    { id: 2, type: 'text', content: 'Count, draw and write the number and word.', x: 40, y: 130, width: 620, height: 30, fontSize: 16, textAlign: 'center', z: 10 },
    { id: 3, type: 'shape', shapeType: 'line', x: 40, y: 160, width: 620, height: 2, stroke: '#000', strokeWidth: 2, z: 1 },
    ...mkFingerBlock(2100, col1_X, c_r1, 'mano_1.png'), ...mkFingerBlock(2200, col2_X, c_r1, 'mano_5.png'),
    ...mkFingerBlock(2300, col1_X, c_r2, 'mano_3.png'), ...mkFingerBlock(2400, col2_X, c_r2, 'mano_7.png'),
    ...mkFingerBlock(2500, col1_X, c_r3, 'mano-4.png'), ...mkFingerBlock(2600, col2_X, c_r3, 'mano-10.png'),
    ...mkFingerBlock(2700, col1_X, c_r4, 'mano-2.png'), ...mkFingerBlock(2800, col2_X, c_r4, 'mano-8.png'),
    ...mkFingerBlock(2900, col1_X, c_r5, 'mano-9.png'), ...mkFingerBlock(3000, col2_X, c_r5, 'mano-6.png'),
    ...createFooter(990)
];

// 8, 9, 10. RESTAS
const m_yStart = 190;
const m_yGap = 170; 
const col1 = 60; const col2 = 280; const col3 = 500;
const w3 = 160; const c1_w3 = 50; const c2_w3 = 270; const c3_w3 = 490;

const resta1Elements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¡A restar!', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    { id: 2, type: 'text', content: 'Resuelve las siguientes restas sencillas.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    ...mkMathBlock(100, col1, m_yStart, '9', '1', '-', 100), ...mkMathBlock(110, col2, m_yStart, '7', '2', '-', 100), ...mkMathBlock(120, col3, m_yStart, '6', '1', '-', 100),
    ...mkMathBlock(130, col1, m_yStart + m_yGap, '8', '2', '-', 100), ...mkMathBlock(140, col2, m_yStart + m_yGap, '6', '3', '-', 100), ...mkMathBlock(150, col3, m_yStart + m_yGap, '8', '7', '-', 100),
    ...mkMathBlock(160, col1, m_yStart + m_yGap * 2, '3', '2', '-', 100), ...mkMathBlock(170, col2, m_yStart + m_yGap * 2, '9', '5', '-', 100), ...mkMathBlock(180, col3, m_yStart + m_yGap * 2, '6', '2', '-', 100),
    ...mkMathBlock(190, col1, m_yStart + m_yGap * 3, '8', '5', '-', 100), ...mkMathBlock(200, col2, m_yStart + m_yGap * 3, '7', '2', '-', 100), ...mkMathBlock(210, col3, m_yStart + m_yGap * 3, '5', '4', '-', 100),
    ...createFooter(960)
];

const resta2Elements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¡A restar!', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    { id: 2, type: 'text', content: 'Recordá restar las unidades primero y luego las decenas.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    ...mkMathBlock(100, col1, m_yStart, '24', '12', '-', 100), ...mkMathBlock(110, col2, m_yStart, '36', '24', '-', 100), ...mkMathBlock(120, col3, m_yStart, '47', '10', '-', 100),
    ...mkMathBlock(130, col1, m_yStart + m_yGap, '54', '13', '-', 100), ...mkMathBlock(140, col2, m_yStart + m_yGap, '18', '12', '-', 100), ...mkMathBlock(150, col3, m_yStart + m_yGap, '67', '32', '-', 100),
    ...mkMathBlock(160, col1, m_yStart + m_yGap * 2, '93', '16', '-', 100), ...mkMathBlock(170, col2, m_yStart + m_yGap * 2, '25', '22', '-', 100), ...mkMathBlock(180, col3, m_yStart + m_yGap * 2, '37', '18', '-', 100),
    ...mkMathBlock(190, col1, m_yStart + m_yGap * 3, '67', '37', '-', 100), ...mkMathBlock(200, col2, m_yStart + m_yGap * 3, '72', '41', '-', 100), ...mkMathBlock(210, col3, m_yStart + m_yGap * 3, '28', '11', '-', 100),
    ...createFooter(960)
];

const resta3Elements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¡A restar!', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    { id: 2, type: 'text', content: 'Desafío de centenas. ¡Tú puedes!', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    ...mkMathBlock(100, c1_w3, m_yStart, '240', '124', '-', w3), ...mkMathBlock(110, c2_w3, m_yStart, '365', '241', '-', w3), ...mkMathBlock(120, c3_w3, m_yStart, '476', '104', '-', w3),
    ...mkMathBlock(130, c1_w3, m_yStart + m_yGap, '541', '138', '-', w3), ...mkMathBlock(140, c2_w3, m_yStart + m_yGap, '182', '125', '-', w3), ...mkMathBlock(150, c3_w3, m_yStart + m_yGap, '673', '324', '-', w3),
    ...mkMathBlock(160, c1_w3, m_yStart + m_yGap * 2, '932', '165', '-', w3), ...mkMathBlock(170, c2_w3, m_yStart + m_yGap * 2, '255', '222', '-', w3), ...mkMathBlock(180, c3_w3, m_yStart + m_yGap * 2, '370', '181', '-', w3),
    ...mkMathBlock(190, c1_w3, m_yStart + m_yGap * 3, '674', '371', '-', w3), ...mkMathBlock(200, c2_w3, m_yStart + m_yGap * 3, '734', '413', '-', w3), ...mkMathBlock(210, c3_w3, m_yStart + m_yGap * 3, '289', '111', '-', w3),
    ...createFooter(960)
];

// 11, 12, 13. SUMAS
const suma1Elements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¡A sumar!', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    { id: 2, type: 'text', content: 'Resuelve las siguientes sumas sencillas.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    ...mkMathBlock(100, col1, m_yStart, '3', '2', '+', 100), ...mkMathBlock(110, col2, m_yStart, '5', '4', '+', 100), ...mkMathBlock(120, col3, m_yStart, '1', '6', '+', 100),
    ...mkMathBlock(130, col1, m_yStart + m_yGap, '2', '2', '+', 100), ...mkMathBlock(140, col2, m_yStart + m_yGap, '4', '3', '+', 100), ...mkMathBlock(150, col3, m_yStart + m_yGap, '7', '1', '+', 100),
    ...mkMathBlock(160, col1, m_yStart + m_yGap * 2, '5', '5', '+', 100), ...mkMathBlock(170, col2, m_yStart + m_yGap * 2, '3', '0', '+', 100), ...mkMathBlock(180, col3, m_yStart + m_yGap * 2, '6', '3', '+', 100),
    ...mkMathBlock(190, col1, m_yStart + m_yGap * 3, '8', '1', '+', 100), ...mkMathBlock(200, col2, m_yStart + m_yGap * 3, '2', '7', '+', 100), ...mkMathBlock(210, col3, m_yStart + m_yGap * 3, '4', '4', '+', 100),
    ...createFooter(960)
];

const suma2Elements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¡A sumar!', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    { id: 2, type: 'text', content: 'Recuerda sumar las unidades primero y luego las decenas.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    ...mkMathBlock(100, col1, m_yStart, '12', '15', '+', 100), ...mkMathBlock(110, col2, m_yStart, '24', '24', '+', 100), ...mkMathBlock(120, col3, m_yStart, '30', '10', '+', 100),
    ...mkMathBlock(130, col1, m_yStart + m_yGap, '45', '13', '+', 100), ...mkMathBlock(140, col2, m_yStart + m_yGap, '22', '17', '+', 100), ...mkMathBlock(150, col3, m_yStart + m_yGap, '61', '28', '+', 100),
    ...mkMathBlock(160, col1, m_yStart + m_yGap * 2, '53', '26', '+', 100), ...mkMathBlock(170, col2, m_yStart + m_yGap * 2, '11', '33', '+', 100), ...mkMathBlock(180, col3, m_yStart + m_yGap * 2, '42', '42', '+', 100),
    ...mkMathBlock(190, col1, m_yStart + m_yGap * 3, '70', '19', '+', 100), ...mkMathBlock(200, col2, m_yStart + m_yGap * 3, '34', '51', '+', 100), ...mkMathBlock(210, col3, m_yStart + m_yGap * 3, '20', '60', '+', 100),
    ...createFooter(960)
];

const suma3Elements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¡A sumar!', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    { id: 2, type: 'text', content: 'Desafío de centenas. ¡Vamos a sumar!', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    ...mkMathBlock(100, c1_w3, m_yStart, '120', '140', '+', w3), ...mkMathBlock(110, c2_w3, m_yStart, '250', '130', '+', w3), ...mkMathBlock(120, c3_w3, m_yStart, '300', '200', '+', w3),
    ...mkMathBlock(130, c1_w3, m_yStart + m_yGap, '410', '155', '+', w3), ...mkMathBlock(140, c2_w3, m_yStart + m_yGap, '122', '366', '+', w3), ...mkMathBlock(150, c3_w3, m_yStart + m_yGap, '505', '104', '+', w3),
    ...mkMathBlock(160, c1_w3, m_yStart + m_yGap * 2, '630', '120', '+', w3), ...mkMathBlock(170, c2_w3, m_yStart + m_yGap * 2, '215', '440', '+', w3), ...mkMathBlock(180, c3_w3, m_yStart + m_yGap * 2, '111', '777', '+', w3),
    ...mkMathBlock(190, c1_w3, m_yStart + m_yGap * 3, '234', '123', '+', w3), ...mkMathBlock(200, c2_w3, m_yStart + m_yGap * 3, '456', '111', '+', w3), ...mkMathBlock(210, c3_w3, m_yStart + m_yGap * 3, '100', '800', '+', w3),
    ...createFooter(960)
];

// 14. ¿QUÉ HORA ES? (ES)
const relojesElements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¿Qué hora es?', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', z: 10 },
    { id: 2, type: 'text', content: 'Dibuja las manecillas o escribe la hora digital.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', z: 10 },
    
    ...mkClockBlock(100, 80, 200),  ...mkClockBlock(110, 290, 200),  ...mkClockBlock(120, 500, 200),
    ...mkClockBlock(130, 80, 450),  ...mkClockBlock(140, 290, 450),  ...mkClockBlock(150, 500, 450),
    
    ...createFooter(960)
];

// 15. WHAT TIME IS IT? (EN)
const relojesEnglishElements = [
    ...createHeaderEN(),
    { id: 1, type: 'text', content: 'What time is it?', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', z: 10 },
    { id: 2, type: 'text', content: 'Draw the hands or write the digital time.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', z: 10 },
    
    ...mkClockBlock(100, 80, 200),  ...mkClockBlock(110, 290, 200),  ...mkClockBlock(120, 500, 200),
    ...mkClockBlock(130, 80, 450),  ...mkClockBlock(140, 290, 450),  ...mkClockBlock(150, 500, 450),
    
    ...createFooter(960)
];

// 16. SECUENCIA DE HISTORIA (ES) - CENTRADO
const secuenciaElements = [
    ...createHeader(),
    { id: 1, type: 'text', content: 'Secuencia de Historia', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', z: 10 },
    { id: 2, type: 'text', content: 'Dibuja o escribe lo que pasó en orden.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', z: 10 },

    // Total ancho bloque: 150 + 30 + 150 + 30 + 150 = 510.
    // Centrado en 700: Margen izq ~95.
    // Caja 1 (x=95)
    ...mkSequenceStep(100, 95, 200, "1. PRIMERO"),
    // Flecha 1 (x=255)
    { id: 150, type: 'shape', shapeType: 'arrow', x: 255, y: 300, width: 30, height: 20, stroke: '#000', strokeWidth: 4, z: 1 },
    
    // Caja 2 (x=295)
    ...mkSequenceStep(200, 295, 200, "2. LUEGO"),
    // Flecha 2 (x=455)
    { id: 250, type: 'shape', shapeType: 'arrow', x: 455, y: 300, width: 30, height: 20, stroke: '#000', strokeWidth: 4, z: 1 },

    // Caja 3 (x=495)
    ...mkSequenceStep(300, 495, 200, "3. AL FINAL"),

    { id: 400, type: 'text', content: 'Resumen / Dibujo Final:', x: 40, y: 500, width: 600, height: 30, fontSize: 16, isBold: true, textAlign: 'left', z: 1 },
    { id: 401, type: 'shape', shapeType: 'rectangle', x: 40, y: 540, width: 620, height: 250, stroke: '#000', strokeWidth: 2, fill: 'transparent', z: 1 },

    ...createFooter(960)
];

// 17. STORY SEQUENCE (EN) - CENTRADO
const secuenciaEnglishElements = [
    ...createHeaderEN(),
    { id: 1, type: 'text', content: 'Story Sequence', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', z: 10 },
    { id: 2, type: 'text', content: 'Draw or write what happened in order.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', z: 10 },

    ...mkSequenceStep(100, 95, 200, "1. FIRST"),
    { id: 150, type: 'shape', shapeType: 'arrow', x: 255, y: 300, width: 30, height: 20, stroke: '#000', strokeWidth: 4, z: 1 },
    
    ...mkSequenceStep(200, 295, 200, "2. NEXT"),
    { id: 250, type: 'shape', shapeType: 'arrow', x: 455, y: 300, width: 30, height: 20, stroke: '#000', strokeWidth: 4, z: 1 },

    ...mkSequenceStep(300, 495, 200, "3. LAST"),

    { id: 400, type: 'text', content: 'Summary / Final Drawing:', x: 40, y: 500, width: 600, height: 30, fontSize: 16, isBold: true, textAlign: 'left', z: 1 },
    { id: 401, type: 'shape', shapeType: 'rectangle', x: 40, y: 540, width: 620, height: 250, stroke: '#000', strokeWidth: 2, fill: 'transparent', z: 1 },

    ...createFooter(960)
];

// 18. MIS TAREAS
const tareasElements = [
    ...createHeader(),
    { id: 1, type: 'text', content: 'Mis Tareas de Hoy', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', z: 10 },
    { id: 2, type: 'text', content: 'Marca las casillas cuando termines cada misión.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', z: 10 },

    ...mkCheckItem(100, 60, 220),
    ...mkCheckItem(200, 60, 320),
    ...mkCheckItem(300, 60, 420),
    ...mkCheckItem(400, 60, 520),
    ...mkCheckItem(500, 60, 620),
    ...mkCheckItem(600, 60, 720),

    { id: 700, type: 'text', content: '¡Buen trabajo!', x: 250, y: 820, width: 200, height: 40, fontSize: 24, isBold: true, textAlign: 'center', color: '#16a34a', z: 1 },
    
    ...createFooter(960)
];


// --- LISTA MAESTRA ---
const templates = [
    { name: 'El Monstruo de las Emociones', category: 'Conducta', thumbnail_url: '/thumbnail-monstruo.jpg', description: 'Identifica emociones.', base_elements: monstruoElements },
    { name: 'Emociones con Lupa', category: 'Conducta', thumbnail_url: '/thumbnail-lupa.jpg', description: 'Reconoce emociones.', base_elements: lupaElements },
    { name: '¿Cómo te ayudo?', category: 'Conducta', thumbnail_url: '/thumbnail-ayuda.jpg', description: 'Empatía y resolución.', base_elements: ayudaElements },
    { name: 'El Dado de las Historias', category: 'Lectoescritura', thumbnail_url: '/thumbnail-dado.jpg', description: 'Crea historias.', base_elements: dadoElements },
    { name: 'BINGO de Palabras', category: 'Lectoescritura', thumbnail_url: '/thumbnail-bingo.jpg', description: 'Juego de vocabulario.', base_elements: bingoElements },
    
    { name: 'Conteo con los dedos', category: 'Matemáticas', thumbnail_url: '/thumbnail-conteo-es.jpg', description: 'Cuenta y escribe.', base_elements: conteoSpanishElements },
    { name: 'Finger Counting', category: 'Inglés', thumbnail_url: '/thumbnail-conteo-en.jpg', description: 'Count and write.', base_elements: conteoEnglishElements },

    { name: 'Resta 1 Cifra', category: 'Matemáticas', thumbnail_url: '/thumbnail-resta-1.jpg', description: 'Restas básicas.', base_elements: resta1Elements },
    { name: 'Resta 2 Cifras', category: 'Matemáticas', thumbnail_url: '/thumbnail-resta-2.jpg', description: 'Restas intermedias.', base_elements: resta2Elements },
    { name: 'Resta 3 Cifras', category: 'Matemáticas', thumbnail_url: '/thumbnail-resta-3.jpg', description: 'Restas avanzadas.', base_elements: resta3Elements },

    // SUMAS
    { name: 'Suma 1 Cifra', category: 'Matemáticas', thumbnail_url: '/thumbnail-suma-1.jpg', description: 'Sumas básicas.', base_elements: suma1Elements },
    { name: 'Suma 2 Cifras', category: 'Matemáticas', thumbnail_url: '/thumbnail-suma-2.jpg', description: 'Sumas intermedias.', base_elements: suma2Elements },
    { name: 'Suma 3 Cifras', category: 'Matemáticas', thumbnail_url: '/thumbnail-suma-3.jpg', description: 'Sumas avanzadas.', base_elements: suma3Elements },

    // NUEVAS
    { name: '¿Qué hora es?', category: 'Matemáticas', thumbnail_url: '/thumbnail-relojes.jpg', description: 'Aprende las horas.', base_elements: relojesElements },
    { name: 'What time is it?', category: 'Inglés', thumbnail_url: '/thumbnail-relojes.jpg', description: 'Learn the time.', base_elements: relojesEnglishElements },
    { name: 'Secuencia de Historia', category: 'Lectoescritura', thumbnail_url: '/thumbnail-secuencia.jpg', description: 'Ordena eventos.', base_elements: secuenciaElements },
    { name: 'Story Sequence', category: 'Inglés', thumbnail_url: '/thumbnail-secuencia.jpg', description: 'Order events.', base_elements: secuenciaEnglishElements },
    { name: 'Mis Tareas de Hoy', category: 'Conducta', thumbnail_url: '/thumbnail-tareas.jpg', description: 'Organización diaria.', base_elements: tareasElements },
];

async function main() {
    try {
        console.log("🧹 Limpiando...");
        await sql`TRUNCATE TABLE templates RESTART IDENTITY CASCADE`;

        for (const t of templates) {
            await sql`INSERT INTO templates (name, category, thumbnail_url, description, base_elements) VALUES (${t.name}, ${t.category}, ${t.thumbnail_url}, ${t.description}, ${sql.json(t.base_elements)})`;
            console.log(`   ✅ ${t.name}`);
        }
        console.log("\n🎉 ¡LISTO! 18 Plantillas cargadas.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

main();