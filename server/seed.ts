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

console.log("🌱 Iniciando RECALIBRACIÓN visual de plantillas...");

// ==========================================
// 1. EL DADO (Ajuste: Bajamos el cubo para que no choque con el título)
// ==========================================
const CUBE_SIZE = 150;
const ICON_SIZE = 100;
const ICON_OFFSET = (CUBE_SIZE - ICON_SIZE) / 2;
const SOLAPA_W = 150;
const SOLAPA_H = 50;
const X_CENTER = 275; 
// CORRECCIÓN: Bajamos Y_START de 50 a 220 para dejar espacio al título
const Y_START = 220;   

const Y1 = Y_START;               
const Y2 = Y1 + CUBE_SIZE;        
const Y3 = Y2 + CUBE_SIZE;        
const Y4 = Y3 + CUBE_SIZE;        
const X2 = X_CENTER;              
const X1 = X2 - CUBE_SIZE;        
const X3 = X2 + CUBE_SIZE;        

const dadoElements = [
    // Títulos (Arriba del todo)
    { id: 1, type: 'text', content: 'El Dado de las Historias', x: 40, y: 40, width: 620, height: 50, fontSize: 36, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 100},
    { id: 2, type: 'text', content: 'Instrucciones: Lanza el dado y crea una historia con el elemento que salga.', x: 40, y: 100, width: 620, height: 60, fontSize: 16, color: '#000000', textAlign: 'center', fontFamily: 'Arial', z: 100 },

    // Caras
    { id: 10, type: 'image', url: '/dado-naranja.png', x: X2, y: Y1, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
    { id: 11, type: 'image', url: '/dado-azul.png',    x: X2, y: Y2, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
    { id: 12, type: 'image', url: '/dado-rojo.png',    x: X2, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
    { id: 13, type: 'image', url: '/dado-cian.png',    x: X2, y: Y4, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
    { id: 14, type: 'image', url: '/dado-amarillo.png',x: X1, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
    { id: 15, type: 'image', url: '/dado-verde.png',   x: X3, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 

    // Iconos
    { id: 20, type: 'image', url: '/dado-icono-persona.png', x: X2 + ICON_OFFSET, y: Y1 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 21, type: 'image', url: '/dado-icono-lugar.png',   x: X2 + ICON_OFFSET, y: Y2 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 22, type: 'image', url: '/dado-icono-persona.png', x: X2 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 23, type: 'image', url: '/dado-icono-lugar.png',   x: X2 + ICON_OFFSET, y: Y4 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 24, type: 'image', url: '/dado-icono-objeto.png',  x: X1 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 25, type: 'image', url: '/dado-icono-objeto.png',  x: X3 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },

    // Solapas
    { id: 30, type: 'image', url: '/dado-solapa.png', x: X2, y: Y1 - SOLAPA_H, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
    { id: 31, type: 'image', url: '/dado-solapa.png', x: X1, y: Y3 - SOLAPA_H, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
    { id: 32, type: 'image', url: '/dado-solapa.png', x: X3, y: Y3 - SOLAPA_H, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
    { id: 33, type: 'image', url: '/dado-solapa.png', x: X2, y: Y4 + CUBE_SIZE, width: SOLAPA_W, height: SOLAPA_H, rotation: 180, z: 3 },
    
    { id: 34, type: 'image', url: '/dado-solapa.png', x: X1 - (SOLAPA_W/2) - (SOLAPA_H/2), y: Y3 + (CUBE_SIZE/2) - (SOLAPA_H/2), width: SOLAPA_W, height: SOLAPA_H, rotation: 270, z: 3 }, 
    { id: 35, type: 'image', url: '/dado-solapa.png', x: X3 + (CUBE_SIZE/2) + (SOLAPA_H/2), y: Y3 + (CUBE_SIZE/2) - (SOLAPA_H/2), width: SOLAPA_W, height: SOLAPA_H, rotation: 90, z: 3 }, 
    { id: 36, type: 'image', url: '/dado-solapa.png', x: X2 - (SOLAPA_W/2) - (SOLAPA_H/2), y: Y4 + (CUBE_SIZE/2) - (SOLAPA_H/2), width: SOLAPA_W, height: SOLAPA_H, rotation: 270, z: 3 },
    { id: 37, type: 'image', url: '/dado-solapa.png', x: X2 + (CUBE_SIZE/2) + (SOLAPA_H/2), y: Y4 + (CUBE_SIZE/2) - (SOLAPA_H/2), width: SOLAPA_W, height: SOLAPA_H, rotation: 90, z: 3 }
];

// ==========================================
// 2. BINGO (Sin cambios, este estaba bien visualmente)
// ==========================================
const bingoY = 80;
const gridYStart = 220;
const rowH = 130;
const gridW = 620;
const gridX = (700 - gridW) / 2;
const row1Y = gridYStart, row2Y = row1Y + rowH, row3Y = row2Y + rowH, row4Y = row3Y + rowH, row5Y = row4Y + rowH;
const colW = gridW / 5, textW = 110, txtOffX = (colW - textW) / 2, txtOffY = 82;
const tX1 = gridX + txtOffX, tX2 = tX1 + colW, tX3 = tX2 + colW, tX4 = tX3 + colW, tX5 = tX4 + colW;

const mkTxt = (id, x, y, txt='...') => ({
    id, type: 'text', content: txt, x, y: y + txtOffY, width: textW, height: 36, fontSize: 16, color: '#000', textAlign: 'center', fontFamily: 'Arial', z: 10
});

const bingoElements = [
    { id: 1, type: 'text', content: 'BINGO', x: 40, y: bingoY, width: 620, height: 130, fontSize: 95, color: '#000', isBold: true, textAlign: 'center', fontFamily: 'Anton', z: 2 },
    { id: 2, type: 'shape', shapeType: 'rectangle', x: 40, y: 190, width: 620, height: 40, fill: '#000', z: 2},
    { id: 3, type: 'text', content: 'EL PRIMERO QUE CANTE GANA', x: 40, y: 198, width: 620, height: 30, fontSize: 20, color: '#FFF', isBold: true, textAlign: 'center', fontFamily: 'Oswald', z: 3 },
    { id: 4, type: 'image', url: '/banderas-decoracion.png', x: 20, y: 30, width: 300, height: 60, rotation: -5, z: 1 },
    { id: 5, type: 'image', url: '/banderas-decoracion.png', x: 200, y: 20, width: 300, height: 60, rotation: 0, z: 1 },
    { id: 6, type: 'image', url: '/banderas-decoracion.png', x: 380, y: 30, width: 300, height: 60, rotation: 5, z: 1 },
    { id: 10, type: 'image', url: '/banderas-bingo-1.png', x: gridX, y: row1Y, width: gridW, height: rowH, z: 1 },
    { id: 11, type: 'image', url: '/banderas-bingo-2.png', x: gridX, y: row2Y, width: gridW, height: rowH, z: 1 },
    { id: 12, type: 'image', url: '/banderas-bingo-3.png', x: gridX, y: row3Y, width: gridW, height: rowH, z: 1 },
    { id: 13, type: 'image', url: '/banderas-bingo-4.png', x: gridX, y: row4Y, width: gridW, height: rowH, z: 1 },
    { id: 14, type: 'image', url: '/banderas-bingo-5.png', x: gridX, y: row5Y, width: gridW, height: rowH, z: 1 },
    mkTxt(100, tX1, row1Y), mkTxt(101, tX2, row1Y), mkTxt(102, tX3, row1Y), mkTxt(103, tX4, row1Y), mkTxt(104, tX5, row1Y),
    mkTxt(105, tX1, row2Y), mkTxt(106, tX2, row2Y), mkTxt(107, tX3, row2Y), mkTxt(108, tX4, row2Y), mkTxt(109, tX5, row2Y),
    mkTxt(110, tX1, row3Y), mkTxt(111, tX2, row3Y), { ...mkTxt(112, tX3, row3Y, 'PALABRA'), isBold: true, fontSize: 18 }, mkTxt(113, tX4, row3Y), mkTxt(114, tX5, row3Y),
    mkTxt(115, tX1, row4Y), mkTxt(116, tX2, row4Y), mkTxt(117, tX3, row4Y), mkTxt(118, tX4, row4Y), mkTxt(119, tX5, row4Y),
    mkTxt(120, tX1, row5Y), mkTxt(121, tX2, row5Y), mkTxt(122, tX3, row5Y), mkTxt(123, tX4, row5Y), mkTxt(124, tX5, row5Y)
];

// ==========================================
// 3. ¿CÓMO TE AYUDO? (Ajuste: Estrechar columnas para evitar desborde)
// ==========================================
// CORRECCIÓN: Ajustamos las X para que todo quepa en 700px
// Columna Izq: X=40, Columna Der: X=360. Max width = 360+180 = 540 (Sobra espacio)
const c1_img = 40;
const c1_txt = 190;
const c2_img = 360;
const c2_txt = 510;
const lineW = 150; // Ancho seguro para no romper línea

const ayudaElements = [
    { id: 1, type: 'text', content: '¿COMO TE AYUDO?', x: 40, y: 40, width: 620, height: 40, fontSize: 36, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    // Header ajustado
    { id: 2, type: 'text', content: 'Nombre:', x: 40, y: 100, width: 70, height: 20, fontSize: 14, color: '#000000', isBold: false, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 102, type: 'text', content: '______________', x: 100, y: 100, width: 150, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 3, type: 'text', content: 'Fecha:', x: 260, y: 100, width: 60, height: 20, fontSize: 14, color: '#000000', isBold: false, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 103, type: 'text', content: '______________', x: 310, y: 100, width: 150, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 4, type: 'text', content: 'Grado:', x: 470, y: 100, width: 60, height: 20, fontSize: 14, color: '#000000', isBold: false, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 104, type: 'text', content: '______________', x: 520, y: 100, width: 150, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    
    { id: 5, type: 'text', content: 'Según lo que ves en la imagen ¿Qué le sucede? o ¿Cómo podemos ayudarlo?', x: 40, y: 140, width: 620, height: 40, fontSize: 16, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    
    // Filas (Ajustadas para no desbordar)
    { id: 10, type: 'image', url: '/situacion-pelea.png', x: c1_img, y: 200, width: 140, height: 100, z: 1},
    { id: 11, type: 'text', content: '• _________________', x: c1_txt, y: 250, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 50, type: 'image', url: '/situacion-consola.png', x: c2_img, y: 200, width: 140, height: 100, z: 1},
    { id: 51, type: 'text', content: '• _________________', x: c2_txt, y: 250, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},

    { id: 20, type: 'image', url: '/situacion-llora-solo.png', x: c1_img, y: 340, width: 140, height: 100, z: 1},
    { id: 21, type: 'text', content: '• _________________', x: c1_txt, y: 390, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 60, type: 'image', url: '/situacion-bici.png', x: c2_img, y: 340, width: 140, height: 100, z: 1},
    { id: 61, type: 'text', content: '• _________________', x: c2_txt, y: 390, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},

    { id: 30, type: 'image', url: '/situacion-quita-juguete.png', x: c1_img, y: 480, width: 140, height: 100, z: 1},
    { id: 31, type: 'text', content: '• _________________', x: c1_txt, y: 530, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 70, type: 'image', url: '/situacion-resbala.png', x: c2_img, y: 480, width: 140, height: 100, z: 1},
    { id: 71, type: 'text', content: '• _________________', x: c2_txt, y: 530, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},

    { id: 40, type: 'image', url: '/situacion-ayuda.png', x: c1_img, y: 620, width: 140, height: 100, z: 1},
    { id: 41, type: 'text', content: '• _________________', x: c1_txt, y: 670, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 80, type: 'image', url: '/situacion-curita.png', x: c2_img, y: 620, width: 140, height: 100, z: 1},
    { id: 81, type: 'text', content: '• _________________', x: c2_txt, y: 670, width: lineW, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},

    { id: 99, type: 'text', content: '¡Gana tu ficha aquí!', x: 380, y: 780, width: 160, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', z: 1},
    { id: 199, type: 'text', content: '______________', x: 550, y: 780, width: 120, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1}
];

// --- 4. EMOCIONES CON LUPA (CORRECCIÓN DE LÍNEAS ROTAS) ---
// Problema: Width 130px rompía las líneas. Solución: Width 200px.
const lupaElements = [
    { id: 1, type: 'text', content: 'EMOCIONES CON LUPA', x: 40, y: 40, width: 350, height: 40, fontSize: 28, color: '#3D246C', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1},
    
    // Header corregido (Anchos mayores)
    { id: 2, type: 'text', content: 'Nombre:', x: 400, y: 40, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 102, type: 'text', content: '_____________________', x: 480, y: 40, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 3, type: 'text', content: 'Fecha:', x: 400, y: 70, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 103, type: 'text', content: '_____________________', x: 480, y: 70, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},

    { id: 4, type: 'text', content: 'Lee con atención cada situación. Une con una flecha la emoción correspondiente.', x: 40, y: 110, width: 620, height: 60, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1 },
    
    { id: 10, type: 'image', url: '/emocion-verguenza.png', x: 60, y: 200, width: 100, height: 80, z: 1},
    { id: 11, type: 'text', content: 'VERGÜENZA', x: 60, y: 285, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 12, type: 'text', content: 'La profe explicó el ejercicio, pero no entendí qué tenía que hacer.', x: 250, y: 210, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},

    { id: 20, type: 'image', url: '/emocion-orgullo.png', x: 60, y: 320, width: 100, height: 80, z: 1},
    { id: 21, type: 'text', content: 'ORGULLO', x: 60, y: 405, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 22, type: 'text', content: 'Quería explicar mi idea, pero nadie me escuchaba.', x: 250, y: 330, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},

    { id: 30, type: 'image', url: '/emocion-calma.png', x: 60, y: 440, width: 100, height: 80, z: 1},
    { id: 31, type: 'text', content: 'CALMA', x: 60, y: 525, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 32, type: 'text', content: 'Se me olvidó lo que iba a decir en voz alta y todos me miraron.', x: 250, y: 450, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},

    { id: 40, type: 'image', url: '/emocion-confusion.png', x: 60, y: 560, width: 100, height: 80, z: 1},
    { id: 41, type: 'text', content: 'CONFUSIÓN', x: 60, y: 645, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 42, type: 'text', content: 'Prometí ir al cumpleaños, pero me olvidé y no fui.', x: 250, y: 570, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},

    { id: 50, type: 'image', url: '/emocion-culpa.png', x: 60, y: 680, width: 100, height: 80, z: 1},
    { id: 51, type: 'text', content: 'CULPA', x: 60, y: 765, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 52, type: 'text', content: 'Aprendí a montar en bici sin ayuda y me sentí muy feliz.', x: 250, y: 690, width: 400, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    
    { id: 99, type: 'text', content: '¡Gana tu ficha aquí!', x: 380, y: 850, width: 160, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', z: 1},
    { id: 199, type: 'text', content: '______________', x: 550, y: 850, width: 120, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1}
];

// --- EL MONSTRUO (Ya estaba bien, lo mantenemos) ---
const monstruoElements = [
    { id: 1, type: 'text', content: 'Nombre:', x: 50, y: 40, width: 60, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 101, type: 'text', content: '_____________________', x: 115, y: 40, width: 180, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 2, type: 'text', content: 'Fecha:', x: 350, y: 40, width: 50, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 102, type: 'text', content: '__________', x: 405, y: 40, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 3, type: 'text', content: 'Grado:', x: 550, y: 40, width: 50, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 103, type: 'text', content: '______', x: 605, y: 40, width: 80, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 4, type: 'text', content: 'El Monstruo de las Emociones', x: 50, y: 90, width: 600, height: 35, fontSize: 24, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', z: 1},
    { id: 6, type: 'text', content: 'El monstruo siente muchas emociones, dice que en cada parte de su cuerpo hay una emoción ¿En qué parte del cuerpo sientes la emoción?', x: 50, y: 140, width: 600, height: 40, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 7, type: 'text', content: 'COLORES Y EMOCIONES:', x: 50, y: 200, width: 600, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 8, type: 'text', content: '• ROJO - IRA/MOLESTIA', x: 70, y: 230, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 9, type: 'text', content: '• MORADO - MIEDO', x: 70, y: 250, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 10, type: 'text', content: '• AZUL - TRISTEZA', x: 70, y: 270, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 11, type: 'text', content: '• AMARILLO - FELICIDAD', x: 70, y: 290, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 12, type: 'text', content: '• VERDE - ASCO', x: 70, y: 310, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1},
    { id: 5, type: 'image', url: '/asdasda-removebg-preview.png', x: 200, y: 360, width: 300, height: 300, z: 1},
    { id: 13, type: 'text', content: '¡Gana tu ficha aquí!', x: 380, y: 920, width: 160, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', z: 1},
    { id: 113, type: 'text', content: '___________', x: 550, y: 920, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', z: 1}
];

// --- LISTA MAESTRA ---
const templates = [
    { name: 'El Monstruo de las Emociones', category: 'Conducta', thumbnail_url: '/thumbnail-monstruo.jpg', description: 'Ayuda al alumno a identificar en qué parte de su cuerpo siente cada emoción.', base_elements: monstruoElements },
    { name: 'Emociones con Lupa', category: 'Conducta', thumbnail_url: '/thumbnail-lupa.jpg', description: 'Actividad para reconocer y diferenciar emociones en distintas situaciones sociales.', base_elements: lupaElements },
    { name: '¿Cómo te ayudo?', category: 'Conducta', thumbnail_url: '/thumbnail-ayuda.jpg', description: 'Fomenta la empatía y la resolución de conflictos mediante imágenes.', base_elements: ayudaElements },
    { name: 'El Dado de las Historias', category: 'Lectoescritura', thumbnail_url: '/thumbnail-dado.jpg', description: 'Plantilla recortable para armar un dado narrativo y crear cuentos.', base_elements: dadoElements },
    { name: 'BINGO de Palabras', category: 'Lectoescritura', thumbnail_url: '/thumbnail-bingo.jpg', description: 'Juego clásico adaptado para reconocer vocabulario o números.', base_elements: bingoElements }
];

// --- EJECUCIÓN ---
async function main() {
    try {
        console.log("🧹 Limpiando plantillas viejas...");
        await sql`TRUNCATE TABLE templates RESTART IDENTITY CASCADE`;

        console.log(`📦 Insertando ${templates.length} plantillas corregidas...`);
        for (const t of templates) {
            await sql`
                INSERT INTO templates (name, category, thumbnail_url, description, base_elements)
                VALUES (${t.name}, ${t.category}, ${t.thumbnail_url}, ${t.description}, ${sql.json(t.base_elements)})
            `;
            console.log(`   ✅ Reparada: ${t.name}`);
        }
        console.log("\n🎉 ¡PLANTILLAS VISUALMENTE CORREGIDAS!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

main();