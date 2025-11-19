import postgres from 'postgres'

// --- LEER VARIABLES DE ENTORNO ---
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

if (!process.env.DATABASE_URL) {
    console.error("❌ Error: No se encontró DATABASE_URL.");
    process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

console.log("🌱 Iniciando actualización de plantillas...");

// --- DATOS CALCULADOS (DADO Y BINGO) ---
// ... (Mismos cálculos de antes para no romper nada) ...
const CUBE_SIZE = 150; const ICON_SIZE = 100; const ICON_OFFSET = (CUBE_SIZE - ICON_SIZE) / 2;
const SOLAPA_W = 150; const SOLAPA_H = 50; const Y_START = 200; const X_CENTER = 275;
const Y1 = Y_START; const Y2 = Y1 + CUBE_SIZE; const Y3 = Y2 + CUBE_SIZE; const Y4 = Y3 + CUBE_SIZE;
const X2 = X_CENTER; const X1 = X2 - CUBE_SIZE; const X3 = X2 + CUBE_SIZE;

const dadoElements = [
    { id: 1, type: 'text', content: 'El Dado de las Historias', x: 40, y: 40, width: 620, height: 40, fontSize: 36, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false, z: 100},
    { id: 2, type: 'text', content: 'Un dado grande con imágenes (personaje, lugar, objeto). El niño lanza el dado y empieza una historia con ese elemento.', x: 40, y: 100, width: 220, height: 160, fontSize: 16, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false, z: 100 },
    { id: 10, type: 'image', url: '/dado-naranja.png', x: X2, y: Y1, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
    { id: 11, type: 'image', url: '/dado-azul.png', x: X2, y: Y2, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
    { id: 12, type: 'image', url: '/dado-rojo.png', x: X2, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
    { id: 13, type: 'image', url: '/dado-cian.png', x: X2, y: Y4, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 }, 
    { id: 14, type: 'image', url: '/dado-amarillo.png', x: X1, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
    { id: 15, type: 'image', url: '/dado-verde.png', x: X3, y: Y3, width: CUBE_SIZE, height: CUBE_SIZE, z: 1 },
    { id: 20, type: 'image', url: '/dado-icono-persona.png', x: X2 + ICON_OFFSET, y: Y1 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 21, type: 'image', url: '/dado-icono-lugar.png', x: X2 + ICON_OFFSET, y: Y2 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 22, type: 'image', url: '/dado-icono-persona.png', x: X2 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 23, type: 'image', url: '/dado-icono-lugar.png', x: X2 + ICON_OFFSET, y: Y4 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 24, type: 'image', url: '/dado-icono-objeto.png', x: X1 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 25, type: 'image', url: '/dado-icono-objeto.png', x: X3 + ICON_OFFSET, y: Y3 + ICON_OFFSET, width: ICON_SIZE, height: ICON_SIZE, z: 2 },
    { id: 30, type: 'image', url: '/dado-solapa.png', x: X2, y: 155, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
    { id: 31, type: 'image', url: '/dado-solapa.png', x: X1, y: 454, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
    { id: 32, type: 'image', url: '/dado-solapa.png', x: X3, y: 456, width: SOLAPA_W, height: SOLAPA_H, rotation: 0, z: 3 },
    { id: 33, type: 'image', url: '/dado-solapa.png', x: X2, y: 794, width: SOLAPA_W, height: SOLAPA_H, rotation: 180, z: 3 },
    { id: 34, type: 'image', url: '/dado-solapa.png', x: 30, y: 550, width: SOLAPA_W, height: SOLAPA_H, rotation: 270, z: 3 },
    { id: 35, type: 'image', url: '/dado-solapa.png', x: 521, y: 550, width: SOLAPA_W, height: SOLAPA_H, rotation: 90, z: 3 },
    { id: 36, type: 'image', url: '/dado-solapa.png', x: 125, y: 645, width: SOLAPA_W, height: SOLAPA_H, rotation: 180, z: 3 },
    { id: 37, type: 'image', url: '/dado-solapa.png', x: X2 + CUBE_SIZE, y: 646, width: SOLAPA_W, height: SOLAPA_H, rotation: 180, z: 3 }
];

const flagWidth = 300; const flagHeight = 60; const bingoFontSize = 95; const bingoHeight = 130; const bingoY = 80;
const subtitleHeight = 40; const subtitleY = bingoY + bingoHeight - 20;
const gridWidth_b = 620; const rowHeight_b = 130; const y1_bingo = subtitleY + subtitleHeight + 20;
const gridX_b = (700 - gridWidth_b) / 2;
const y2_bingo = y1_bingo + rowHeight_b, y3_bingo = y2_bingo + rowHeight_b, y4_bingo = y3_bingo + rowHeight_b, y5_bingo = y4_bingo + rowHeight_b;
const colWidth = gridWidth_b / 5, textWidth = 110, textHeight = 36, textFontSize = 16;
const textXOffset = (colWidth - textWidth) / 2, textYOffset = 82;
const bx1 = gridX_b + textXOffset, bx2 = bx1 + colWidth, bx3 = bx2 + colWidth, bx4 = bx3 + colWidth, bx5 = bx4 + colWidth;

const createText = (id: number, x: number, y: number, content = '...') => ({
    id, type: 'text', content, x, y: y + textYOffset, width: textWidth, height: textHeight, fontSize: textFontSize, color: '#000000', isBold: false, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false, z: 10
});

const bingoElements = [
    { id: 4, type: 'image', url: '/banderas-decoracion.png', x: 20, y: 30, width: flagWidth, height: flagHeight, rotation: -5, z: 1 },
    { id: 5, type: 'image', url: '/banderas-decoracion.png', x: 200, y: 20, width: flagWidth, height: flagHeight, rotation: 0, z: 1 },
    { id: 6, type: 'image', url: '/banderas-decoracion.png', x: 380, y: 30, width: flagWidth, height: flagHeight, rotation: 5, z: 1 },
    { id: 1, type: 'text', content: 'BINGO', x: 40, y: bingoY, width: 620, height: bingoHeight, fontSize: bingoFontSize, lineHeight: 1.0, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Anton', isItalic: false, isUnderlined: false, z: 2 },
    { id: 2, type: 'shape', shapeType: 'rectangle', x: 40, y: subtitleY, width: 620, height: subtitleHeight, fill: '#000000', stroke: '#000000', strokeWidth: 0, z: 2},
    { id: 3, type: 'text', content: 'EL PRIMERO QUE CANTE GANA', x: 40, y: subtitleY + 8, width: 620, height: 30, fontSize: 20, color: '#FFFFFF', isBold: true, textAlign: 'center', fontFamily: 'Oswald', isItalic: false, isUnderlined: false, z: 3 },
    { id: 10, type: 'image', url: '/banderas-bingo-1.png', x: gridX_b, y: y1_bingo, width: gridWidth_b, height: rowHeight_b, z: 1 },
    { id: 11, type: 'image', url: '/banderas-bingo-2.png', x: gridX_b, y: y2_bingo, width: gridWidth_b, height: rowHeight_b, z: 1 },
    { id: 12, type: 'image', url: '/banderas-bingo-3.png', x: gridX_b, y: y3_bingo, width: gridWidth_b, height: rowHeight_b, z: 1 },
    { id: 13, type: 'image', url: '/banderas-bingo-4.png', x: gridX_b, y: y4_bingo, width: gridWidth_b, height: rowHeight_b, z: 1 },
    { id: 14, type: 'image', url: '/banderas-bingo-5.png', x: gridX_b, y: y5_bingo, width: gridWidth_b, height: rowHeight_b, z: 1 },
    createText(100, bx1, y1_bingo), createText(101, bx2, y1_bingo), createText(102, bx3, y1_bingo), createText(103, bx4, y1_bingo), createText(104, bx5, y1_bingo),
    createText(105, bx1, y2_bingo), createText(106, bx2, y2_bingo), createText(107, bx3, y2_bingo), createText(108, bx4, y2_bingo), createText(109, bx5, y2_bingo),
    createText(110, bx1, y3_bingo), createText(111, bx2, y3_bingo), { ...createText(112, bx3, y3_bingo, 'PALABRA'), isBold: true, fontSize: 18 }, createText(113, bx4, y3_bingo), createText(114, bx5, y3_bingo),
    createText(115, bx1, y4_bingo), createText(116, bx2, y4_bingo), createText(117, bx3, y4_bingo), createText(118, bx4, y4_bingo), createText(119, bx5, y4_bingo),
    createText(120, bx1, y5_bingo), createText(121, bx2, y5_bingo), createText(122, bx3, y5_bingo), createText(123, bx4, y5_bingo), createText(124, bx5, y5_bingo),
];

// --- LISTA MAESTRA (AHORA CON DESCRIPCIONES) ---
const templates = [
    {
        id: 1,
        name: 'El Monstruo de las Emociones',
        category: 'Conducta',
        thumbnail_url: '/thumbnail-monstruo.jpg',
        description: 'Ayuda al alumno a identificar en qué parte de su cuerpo siente cada emoción.',
        base_elements: [
            { id: 1, type: 'text', content: 'Nombre:', x: 50, y: 40, width: 60, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 101, type: 'text', content: '_____________________', x: 115, y: 40, width: 180, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 2, type: 'text', content: 'Fecha:', x: 350, y: 40, width: 50, height: 20, fontSize: 12, color: "#000000", isBold: true, textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 102, type: 'text', content: '__________', x: 405, y: 40, width: 100, height: 20, fontSize: 12, color: "#000000", textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 3, type: 'text', content: 'Grado:', x: 550, y: 40, width: 50, height: 20, fontSize: 12, color: "#000000", isBold: true, textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 103, type: 'text', content: '______', x: 605, y: 40, width: 80, height: 20, fontSize: 12, color: "#000000", textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 4, type: 'text', content: 'El Monstruo de las Emociones', x: 50, y: 90, width: 600, height: 35, fontSize: 24, color: "#000000", isBold: true, textAlign: "center", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 6, type: 'text', content: 'El monstruo siente muchas emociones, dice que en cada parte de su cuerpo hay una emoción ¿En qué parte del cuerpo sientes la emoción?', x: 50, y: 140, width: 600, height: 40, fontSize: 12, color: "#000000", textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 7, type: 'text', content: 'COLORES Y EMOCIONES:', x: 50, y: 200, width: 600, height: 20, fontSize: 12, color: "#000000", isBold: true, textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 8, type: 'text', content: '• ROJO - IRA/MOLESTIA', x: 70, y: 230, width: 250, height: 18, fontSize: 12, color: "#000000", textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 9, type: 'text', content: '• MORADO - MIEDO', x: 70, y: 250, width: 250, height: 18, fontSize: 12, color: "#000000", textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 10, type: 'text', content: '• AZUL - TRISTEZA', x: 70, y: 270, width: 250, height: 18, fontSize: 12, color: "#000000", textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 11, type: 'text', content: '• AMARILLO - FELICIDAD', x: 70, y: 290, width: 250, height: 18, fontSize: 12, color: "#000000", textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 12, type: 'text', content: '• VERDE - ASCO', x: 70, y: 310, width: 250, height: 18, fontSize: 12, color: "#000000", textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 5, type: 'image', url: '/asdasda-removebg-preview.png', x: 200, y: 360, width: 300, height: 300},
            { id: 13, type: 'text', content: '¡Gana tu ficha aquí!', x: 380, y: 920, width: 160, height: 20, fontSize: 12, color: "#000000", isBold: true, textAlign: "right", fontFamily: "Arial", isItalic: false, isUnderlined: false},
            { id: 113, type: 'text', content: '___________', x: 550, y: 920, width: 100, height: 20, fontSize: 12, color: "#000000", textAlign: "left", fontFamily: "Arial", isItalic: false, isUnderlined: false}
        ]
    },
    {
        id: 2,
        name: 'Emociones con Lupa',
        category: 'Conducta',
        thumbnail_url: '/thumbnail-lupa.jpg',
        description: 'Actividad para reconocer y diferenciar emociones en distintas situaciones sociales.',
        base_elements: [
            { id: 1, type: 'text', content: 'EMOCIONES CON LUPA', x: 40, y: 40, width: 350, height: 40, fontSize: 28, color: '#3D246C', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 2, type: 'text', content: 'Nombre:', x: 450, y: 40, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 102, type: 'text', content: '__________________', x: 530, y: 40, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 3, type: 'text', content: 'Fecha:', x: 450, y: 70, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 103, type: 'text', content: '__________________', x: 530, y: 70, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 4, type: 'text', content: 'Lee con atención cada situación.\nDespués, une con una flecha la emoción que crees que encaja mejor.\nAlgunas emociones pueden parecerse... ¡pero piensa bien antes de decidir!', x: 40, y: 110, width: 620, height: 60, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
            { id: 10, type: 'image', url: '/emocion-verguenza.png', x: 90, y: 200, width: 100, height: 80 },
            { id: 11, type: 'text', content: 'VERGÜENZA', x: 90, y: 285, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 20, type: 'image', url: '/emocion-orgullo.png', x: 90, y: 310, width: 100, height: 80 },
            { id: 21, type: 'text', content: 'ORGULLO', x: 90, y: 395, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 30, type: 'image', url: '/emocion-calma.png', x: 90, y: 420, width: 100, height: 80 },
            { id: 31, type: 'text', content: 'CALMA', x: 90, y: 505, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 40, type: 'image', url: '/emocion-confusion.png', x: 90, y: 530, width: 100, height: 80 },
            { id: 41, type: 'text', content: 'CONFUSIÓN', x: 90, y: 615, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 50, type: 'image', url: '/emocion-culpa.png', x: 90, y: 640, width: 100, height: 80 },
            { id: 51, type: 'text', content: 'CULPA', x: 90, y: 725, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 60, type: 'image', url: '/emocion-frustracion.png', x: 90, y: 750, width: 100, height: 80 },
            { id: 61, type: 'text', content: 'FRUSTRACIÓN', x: 90, y: 835, width: 100, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 12, type: 'text', content: 'La profe explicó el ejercicio, pero no entendí qué tenía que hacer.', x: 280, y: 205, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 22, type: 'text', content: 'Quería explicar mi idea, pero nadie me escuchaba.', x: 280, y: 315, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 32, type: 'text', content: 'Se me olvidó lo que iba a decir en voz alta y todos me miraron.', x: 280, y: 425, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 42, type: 'text', content: 'Prometí ir al cumpleaños, pero me olvidé y no fui.', x: 280, y: 535, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 52, type: 'text', content: 'Aprendí a montar en bici sin ayuda y me sentí muy feliz.', x: 280, y: 645, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 62, type: 'text', content: 'Estaba pintando sin prisa, con música bajita, y me sentía en paz.', x: 280, y: 755, width: 380, height: 70, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 99, type: 'text', content: '¡Gana tu ficha aquí!', x: 400, y: 940, width: 160, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 199, type: 'text', content: '___________', x: 570, y: 940, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false}
        ]
    },
    {
        id: 3,
        name: '¿Cómo te ayudo?',
        category: 'Conducta',
        thumbnail_url: '/thumbnail-ayuda.jpg',
        description: 'Fomenta la empatía y la resolución de conflictos mediante imágenes.',
        base_elements: [
            { id: 1, type: 'text', content: '¿COMO TE AYUDO?', x: 40, y: 40, width: 620, height: 40, fontSize: 36, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 2, type: 'text', content: 'Nombre:', x: 40, y: 100, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: false, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 102, type: 'text', content: '__________________', x: 100, y: 100, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 3, type: 'text', content: 'Fecha:', x: 280, y: 100, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: false, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 103, type: 'text', content: '__________________', x: 330, y: 100, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 4, type: 'text', content: 'Grado:', x: 510, y: 100, width: 80, height: 20, fontSize: 14, color: '#000000', isBold: false, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 104, type: 'text', content: '__________________', x: 560, y: 100, width: 130, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 5, type: 'text', content: 'Según lo que ves en la imagen ¿Qué le sucede? o ¿Cómo podemos ayudarlo?', x: 40, y: 140, width: 620, height: 40, fontSize: 16, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
            { id: 10, type: 'image', url: '/situacion-pelea.png', x: 60, y: 200, width: 140, height: 100 },
            { id: 11, type: 'text', content: '• ________________________', x: 220, y: 250, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 20, type: 'image', url: '/situacion-llora-solo.png', x: 60, y: 340, width: 140, height: 100 },
            { id: 21, type: 'text', content: '• ________________________', x: 220, y: 390, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 30, type: 'image', url: '/situacion-quita-juguete.png', x: 60, y: 480, width: 140, height: 100 },
            { id: 31, type: 'text', content: '• ________________________', x: 220, y: 530, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 40, type: 'image', url: '/situacion-ayuda.png', x: 60, y: 620, width: 140, height: 100 },
            { id: 41, type: 'text', content: '• ________________________', x: 220, y: 670, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 50, type: 'image', url: '/situacion-consola.png', x: 380, y: 200, width: 140, height: 100 },
            { id: 51, type: 'text', content: '• ________________________', x: 540, y: 250, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 60, type: 'image', url: '/situacion-bici.png', x: 380, y: 340, width: 140, height: 100 },
            { id: 61, type: 'text', content: '• ________________________', x: 540, y: 390, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 70, type: 'image', url: '/situacion-resbala.png', x: 380, y: 480, width: 140, height: 100 },
            { id: 71, type: 'text', content: '• ________________________', x: 540, y: 530, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 80, type: 'image', url: '/situacion-curita.png', x: 380, y: 620, width: 140, height: 100 },
            { id: 81, type: 'text', content: '• ________________________', x: 540, y: 670, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 99, type: 'text', content: '¡Gana tu ficha aquí!', x: 400, y: 880, width: 160, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
            { id: 199, type: 'text', content: '___________', x: 570, y: 880, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false}
        ]
    },
    {
        id: 4,
        name: 'El Dado de las Historias',
        category: 'Lectoescritura',
        thumbnail_url: '/thumbnail-dado.jpg',
        description: 'Plantilla recortable para armar un dado narrativo y crear cuentos.',
        base_elements: dadoElements
    },
    {
        id: 5,
        name: 'BINGO de Palabras',
        category: 'Lectoescritura',
        thumbnail_url: '/thumbnail-bingo.jpg',
        description: 'Juego clásico adaptado para reconocer vocabulario o números.',
        base_elements: bingoElements
    }
];

// --- EJECUCIÓN ---
async function main() {
    try {
        // 1. Borrar la tabla vieja para que se cree con la nueva columna
        console.log("⚠️  Borrando tabla 'templates' antigua...");
        await sql`DROP TABLE IF EXISTS templates`;

        // 2. Crear tabla con la nueva columna 'description'
        console.log("🏗️  Creando nueva tabla 'templates' con descripciones...");
        await sql`
            CREATE TABLE templates (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                thumbnail_url TEXT,
                description TEXT,
                base_elements JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `;

        // 3. Insertar datos
        console.log(`📦 Insertando ${templates.length} plantillas con descripción...`);
        for (const t of templates) {
            await sql`
                INSERT INTO templates (name, category, thumbnail_url, description, base_elements)
                VALUES (${t.name}, ${t.category}, ${t.thumbnail_url}, ${t.description}, ${sql.json(t.base_elements)})
            `;
            console.log(`   ✅ Insertada: ${t.name}`);
        }

        console.log("\n🎉 ¡BASE DE DATOS ACTUALIZADA CON ÉXITO!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error durante la actualización:", error);
        process.exit(1);
    }
}

main();