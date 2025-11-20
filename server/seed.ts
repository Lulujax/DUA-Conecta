import postgres from 'postgres'

// --- 1. CONFIGURACIÓN ---
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

console.log("🌱 Ajustando 'Suma 2 Cifras' (Ancho 120px, Fuente 38px)...");

// =====================================================================
//  HELPERS DE DISEÑO
// =====================================================================

const createHeader = () => [
    { id: 5001, type: 'text', content: 'Nombre:', x: 40, y: 40, width: 60, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5002, type: 'text', content: '_______________________', x: 105, y: 40, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5003, type: 'text', content: 'Fecha:', x: 320, y: 40, width: 50, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5004, type: 'text', content: '___________', x: 375, y: 40, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5005, type: 'text', content: 'Grado:', x: 500, y: 40, width: 50, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5006, type: 'text', content: '_______', x: 555, y: 40, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 }
];

const createHeaderEN = () => [
    { id: 5001, type: 'text', content: 'Name:', x: 40, y: 40, width: 50, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5002, type: 'text', content: '_______________________', x: 95, y: 40, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5003, type: 'text', content: 'Date:', x: 320, y: 40, width: 50, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5004, type: 'text', content: '___________', x: 375, y: 40, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5005, type: 'text', content: 'Grade:', x: 500, y: 40, width: 50, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1 },
    { id: 5006, type: 'text', content: '_______', x: 555, y: 40, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 }
];

const createFooter = (y) => [
    { id: 5998, type: 'text', content: '¡Gana tu ficha aquí!', x: 400, y: y, width: 150, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', z: 1 },
    { id: 5999, type: 'text', content: '____________', x: 560, y: y, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 }
];

// --- GENERADOR DE BLOQUE MATEMÁTICO (MEJORADO) ---
// AHORA ACEPTA 'fontSize' COMO ARGUMENTO
const mkMathBlock = (idBase, x, y, n1, n2, operator, width = 140, fontSize = 35) => {
    const height = 140;
    const lineY = y + 90; 
    const paddingRight = 30;

    return [
        // 1. Caja
        { 
            id: idBase, type: 'shape', shapeType: 'rectangle', 
            x: x, y: y, width: width, height: height, 
            stroke: '#000000', strokeWidth: 3, fill: 'transparent', z: 1 
        },
        // 2. Línea
        { 
            id: idBase + 1, type: 'shape', shapeType: 'line', 
            x: x, y: lineY, width: width, height: 2, 
            stroke: '#000000', strokeWidth: 2, z: 2 
        },
        // 3. Número Superior
        { 
            id: idBase + 2, type: 'text', content: n1, 
            x: x, 
            y: y + 10, 
            width: width - paddingRight, 
            height: 45, 
            fontSize: fontSize, // <--- USAMOS LA VARIABLE
            textAlign: 'right', fontFamily: 'Arial', z: 3 
        },
        // 4. Signo
        { 
            id: idBase + 3, type: 'text', content: operator, 
            x: x + 15, 
            y: y + 50, 
            width: 20, 
            height: 40, 
            fontSize: fontSize, // <--- USAMOS LA VARIABLE
            textAlign: 'left', 
            fontFamily: 'Arial', z: 3 
        },
        // 5. Número Inferior
        { 
            id: idBase + 4, type: 'text', content: n2, 
            x: x, 
            y: y + 50, 
            width: width - paddingRight, 
            height: 45, 
            fontSize: fontSize, // <--- USAMOS LA VARIABLE
            textAlign: 'right', fontFamily: 'Arial', z: 3 
        },
    ];
};

// --- GENERADOR DE DEDOS ---
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


// =====================================================================
//  PLANTILLAS DE MATEMÁTICAS
// =====================================================================
const m_yStart = 190;
const m_yGap = 170; 
const col1 = 60; const col2 = 280; const col3 = 500;

// --- 1. SUMA 1 CIFRA (Estándar) ---
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

// --- 2. SUMA 2 CIFRAS (EXPANDIDA) ---
// AJUSTE: Usamos ancho 120 y fuente 38 (3 puntos más que 35)
const w2_sum = 120; 
const fs2_sum = 38;

const suma2Elements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¡A sumar!', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    { id: 2, type: 'text', content: 'Recuerda sumar las unidades primero y luego las decenas.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', fontFamily: 'Arial', z: 10 },

    // Pasamos w2_sum y fs2_sum a mkMathBlock
    ...mkMathBlock(100, col1, m_yStart, '12', '15', '+', w2_sum, fs2_sum), ...mkMathBlock(110, col2, m_yStart, '24', '24', '+', w2_sum, fs2_sum), ...mkMathBlock(120, col3, m_yStart, '30', '10', '+', w2_sum, fs2_sum),
    ...mkMathBlock(130, col1, m_yStart + m_yGap, '45', '13', '+', w2_sum, fs2_sum), ...mkMathBlock(140, col2, m_yStart + m_yGap, '22', '17', '+', w2_sum, fs2_sum), ...mkMathBlock(150, col3, m_yStart + m_yGap, '61', '28', '+', w2_sum, fs2_sum),
    ...mkMathBlock(160, col1, m_yStart + m_yGap * 2, '53', '26', '+', w2_sum, fs2_sum), ...mkMathBlock(170, col2, m_yStart + m_yGap * 2, '11', '33', '+', w2_sum, fs2_sum), ...mkMathBlock(180, col3, m_yStart + m_yGap * 2, '42', '42', '+', w2_sum, fs2_sum),
    ...mkMathBlock(190, col1, m_yStart + m_yGap * 3, '70', '19', '+', w2_sum, fs2_sum), ...mkMathBlock(200, col2, m_yStart + m_yGap * 3, '34', '51', '+', w2_sum, fs2_sum), ...mkMathBlock(210, col3, m_yStart + m_yGap * 3, '20', '60', '+', w2_sum, fs2_sum),
    
    ...createFooter(960)
];

// --- 3. SUMA 3 CIFRAS ---
const w3 = 140;
const c1_w3 = 50; const c2_w3 = 270; const c3_w3 = 490;

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

// --- 4. RESTA 1 CIFRA ---
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

// --- 5. RESTA 2 CIFRAS (ESTÁNDAR) ---
const resta2Elements = [
    ...createHeader(),
    { id: 1, type: 'text', content: '¡A restar!', x: 40, y: 90, width: 620, height: 50, fontSize: 42, isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 10 },
    { id: 2, type: 'text', content: 'Recordá restar las unidades primero y luego las decenas.', x: 40, y: 140, width: 620, height: 30, fontSize: 16, textAlign: 'center', fontFamily: 'Arial', z: 10 },

    // Usamos el estándar 100 de ancho y 35 de fuente
    ...mkMathBlock(100, col1, m_yStart, '24', '12', '-', 100), ...mkMathBlock(110, col2, m_yStart, '36', '24', '-', 100), ...mkMathBlock(120, col3, m_yStart, '47', '10', '-', 100),
    ...mkMathBlock(130, col1, m_yStart + m_yGap, '54', '13', '-', 100), ...mkMathBlock(140, col2, m_yStart + m_yGap, '18', '12', '-', 100), ...mkMathBlock(150, col3, m_yStart + m_yGap, '67', '32', '-', 100),
    ...mkMathBlock(160, col1, m_yStart + m_yGap * 2, '93', '16', '-', 100), ...mkMathBlock(170, col2, m_yStart + m_yGap * 2, '25', '22', '-', 100), ...mkMathBlock(180, col3, m_yStart + m_yGap * 2, '37', '18', '-', 100),
    ...mkMathBlock(190, col1, m_yStart + m_yGap * 3, '67', '37', '-', 100), ...mkMathBlock(200, col2, m_yStart + m_yGap * 3, '72', '41', '-', 100), ...mkMathBlock(210, col3, m_yStart + m_yGap * 3, '28', '11', '-', 100),
    
    ...createFooter(960)
];

// --- 6. RESTA 3 CIFRAS ---
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

// --- CONTEO ---
const conteoY = 180; const conteoH = 160; const col1_X = 40; const col2_X = 350; 
const c_r1 = conteoY; const c_r2 = c_r1 + conteoH; const c_r3 = c_r2 + conteoH; const c_r4 = c_r3 + conteoH; const c_r5 = c_r4 + conteoH;

const conteoSpanishElements = [
    ...createHeader(),
    { id: 1, type: 'text', content: 'Conteo con los dedos', x: 40, y: 90, width: 620, height: 40, fontSize: 36, isBold: true, textAlign: 'center', z: 10 },
    { id: 2, type: 'text', content: 'Cuenta, dibuja y escribe el número y la palabra.', x: 40, y: 130, width: 620, height: 30, fontSize: 16, textAlign: 'center', z: 10 },
    { id: 3, type: 'shape', shapeType: 'line', x: 40, y: 160, width: 620, height: 2, stroke: '#000', strokeWidth: 2, z: 1 },
    // Manos (con guion BAJO)
    ...mkFingerBlock(100, col1_X, c_r1, 'mano_1.png'), ...mkFingerBlock(200, col2_X, c_r1, 'mano_5.png'),
    ...mkFingerBlock(300, col1_X, c_r2, 'mano_3.png'), ...mkFingerBlock(400, col2_X, c_r2, 'mano_7.png'),
    ...mkFingerBlock(500, col1_X, c_r3, 'mano_4.png'), ...mkFingerBlock(600, col2_X, c_r3, 'mano_10.png'),
    ...mkFingerBlock(700, col1_X, c_r4, 'mano_2.png'), ...mkFingerBlock(800, col2_X, c_r4, 'mano_8.png'),
    ...mkFingerBlock(900, col1_X, c_r5, 'mano_9.png'), ...mkFingerBlock(1000, col2_X, c_r5, 'mano_6.png'),
    ...createFooter(990)
];

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

// --- CONSTANTES VIEJAS ---
const c1_img = 40; const c1_txt = 190; const c2_img = 360; const c2_txt = 510; const lineW = 150;
const CUBE_SIZE = 150; const ICON_SIZE = 100; const ICON_OFFSET = 25; const SOLAPA_W = 150; const SOLAPA_H = 50; const X_CENTER = 275; const Y_START_DADO = 250; 
const Y1 = Y_START_DADO, Y2 = Y1 + CUBE_SIZE, Y3 = Y2 + CUBE_SIZE, Y4 = Y3 + CUBE_SIZE, X2 = X_CENTER, X1 = X2 - CUBE_SIZE, X3 = X2 + CUBE_SIZE;        
const bingoY = 40; const gridYStart = 210; const rowH = 130; const gridW = 620; const gridX = 40;
const row1Y = gridYStart, row2Y = row1Y + rowH, row3Y = row2Y + rowH, row4Y = row3Y + rowH, row5Y = row4Y + rowH;
const colW = gridW / 5, textW = 110, txtOffX = (colW - textW) / 2, txtOffY = 82;
const tX1 = gridX + txtOffX, tX2 = tX1 + colW, tX3 = tX2 + colW, tX4 = tX3 + colW, tX5 = tX4 + colW;
const mkTxt = (id, x, y, txt='...') => ({ id: 2000 + id, type: 'text', content: txt, x, y: y + txtOffY, width: textW, height: 36, fontSize: 16, color: '#000', textAlign: 'center', fontFamily: 'Arial', z: 10 });

// --- PLANTILLAS VIEJAS ---
const monstruoElements = [ ...createHeader(), { id: 4, type: 'text', content: 'El Monstruo de las Emociones', x: 40, y: 80, width: 620, height: 35, fontSize: 24, color: '#000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1}, { id: 5, type: 'image', url: '/asdasda-removebg-preview.png', x: 200, y: 360, width: 300, height: 300, z: 1}, ...createFooter(920) ];
const lupaElements = [ ...createHeader(), { id: 1, type: 'text', content: 'EMOCIONES CON LUPA', x: 40, y: 40, width: 400, height: 40, fontSize: 28, color: '#3D246C', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1}, { id: 10, type: 'image', url: '/emocion-verguenza.png', x: 60, y: 180, width: 100, height: 80, z: 1}, ...createFooter(920) ];
const ayudaElements = [ ...createHeader(), { id: 1, type: 'text', content: '¿COMO TE AYUDO?', x: 40, y: 80, width: 620, height: 40, fontSize: 36, color: '#000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1}, { id: 10, type: 'image', url: '/situacion-pelea.png', x: c1_img, y: 200, width: 140, height: 100, z: 1}, ...createFooter(780) ];
const dadoElements = [ ...createHeader(), { id: 1, type: 'text', content: 'El Dado de las Historias', x: 40, y: 80, width: 620, height: 40, fontSize: 36, color: '#000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 100}, { id: 10, type: 'image', url: '/dado-naranja.png', x: X2, y: Y1, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, ...createFooter(900) ];
const bingoElements = [ { id: 1, type: 'text', content: 'BINGO', x: 40, y: bingoY, width: 620, height: 130, fontSize: 95, color: '#000', isBold: true, textAlign: 'center', fontFamily: 'Anton', z: 2 }, { id: 10, type: 'image', url: '/banderas-bingo-1.png', x: gridX, y: row1Y, width: gridW, height: rowH, z: 1 }, ...createFooter(910) ];

// --- LISTA FINAL ---
const templates = [
    { name: 'El Monstruo de las Emociones', category: 'Conducta', thumbnail_url: '/thumbnail-monstruo.jpg', description: 'Identifica emociones.', base_elements: monstruoElements },
    { name: 'Emociones con Lupa', category: 'Conducta', thumbnail_url: '/thumbnail-lupa.jpg', description: 'Reconoce emociones.', base_elements: lupaElements },
    { name: '¿Cómo te ayudo?', category: 'Conducta', thumbnail_url: '/thumbnail-ayuda.jpg', description: 'Empatía y resolución.', base_elements: ayudaElements },
    { name: 'El Dado de las Historias', category: 'Lectoescritura', thumbnail_url: '/thumbnail-dado.jpg', description: 'Crea historias.', base_elements: dadoElements },
    { name: 'BINGO de Palabras', category: 'Lectoescritura', thumbnail_url: '/thumbnail-bingo.jpg', description: 'Juego de vocabulario.', base_elements: bingoElements },
    
    // Conteo (Español + Inglés) - CORREGIDO thumbnail
    { name: 'Conteo con los dedos', category: 'Matemáticas', thumbnail_url: '/thumbnail-conteo-es.jpg', description: 'Cuenta y escribe.', base_elements: conteoSpanishElements },
    { name: 'Finger Counting', category: 'Inglés', thumbnail_url: '/thumbnail-conteo-en.jpg', description: 'Count and write (English).', base_elements: conteoEnglishElements },

    // Sumas
    { name: 'Suma 1 Cifra', category: 'Matemáticas', thumbnail_url: '/thumbnail-suma-1.jpg', description: 'Sumas básicas.', base_elements: suma1Elements },
    { name: 'Suma 2 Cifras', category: 'Matemáticas', thumbnail_url: '/thumbnail-suma-2.jpg', description: 'Sumas intermedias.', base_elements: suma2Elements },
    { name: 'Suma 3 Cifras', category: 'Matemáticas', thumbnail_url: '/thumbnail-suma-3.jpg', description: 'Sumas avanzadas.', base_elements: suma3Elements },

    // Restas
    { name: 'Resta 1 Cifra', category: 'Matemáticas', thumbnail_url: '/thumbnail-resta-1.jpg', description: 'Restas básicas.', base_elements: resta1Elements },
    { name: 'Resta 2 Cifras', category: 'Matemáticas', thumbnail_url: '/thumbnail-resta-2.jpg', description: 'Restas intermedias.', base_elements: resta2Elements },
    { name: 'Resta 3 Cifras', category: 'Matemáticas', thumbnail_url: '/thumbnail-resta-3.jpg', description: 'Restas avanzadas.', base_elements: resta3Elements }
];

async function main() {
    try {
        console.log("🧹 Limpiando...");
        await sql`TRUNCATE TABLE templates RESTART IDENTITY CASCADE`;
        for (const t of templates) {
            await sql`INSERT INTO templates (name, category, thumbnail_url, description, base_elements) VALUES (${t.name}, ${t.category}, ${t.thumbnail_url}, ${t.description}, ${sql.json(t.base_elements)})`;
            console.log(`   ✅ ${t.name}`);
        }
        console.log("\n🎉 ¡LISTO! Suite Completa (12 Plantillas).");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

main();