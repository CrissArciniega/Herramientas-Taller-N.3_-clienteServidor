/*                  TRABAJO EN CLASE, lunes 06 de enero del 2025
Descripción:
Se desea simular una carrera entre varios corredores, donde cada corredor tiene una velocidad constante.
Instrucciones:
- El usuario debería ingresar el número de corredores y la distancia_recorrida a recorrer (km). El servicio simulará la velocidad (km/h)(random).
- Simular el avance de cada corredor en cada unidad de tiempo (hora).
- Imprimir la posición (km) de cada corredor en cada unidad de tiempo.
- Determine qué corredor ganó la competencia.
- Se generará una estructura all (get-put-post-delete) donde la información generada e ingresada se almacenará en un JSON a manera de una Base de Datos.
*/

/*MÓDULO EXPRESS*/
const express = require('express');
const fs = require('fs'); // Importación de 'fs' para operaciones con archivos
const app = express();
app.use(express.json());

// Archivo JSON usado como base de datos
const bdd_json = 'bdd.json';

// Inicializar la base de datos si no existe
if (!fs.existsSync(bdd_json)) {
    fs.writeFileSync(bdd_json, JSON.stringify({ carreras: [] }, null, 2));
}

// Funciones para leer y escribir en la "base de datos"
const leer_bdd = () => JSON.parse(fs.readFileSync(bdd_json));
const escribir_bdd = (data) => fs.writeFileSync(bdd_json, JSON.stringify(data, null, 2));

/**
 * POST /carreras
 * Crea una nueva carrera.
 * URL: http://localhost:3000/carreras
 */
app.post('/carreras', (req, res) => {
    const { numero_de_corredores, distancia_recorrida } = req.body;
    if (!numero_de_corredores || !distancia_recorrida) {
        return res.status(400).send('Se requieren un número de corredores y una distancia por recorrer.');
    }

    const carrera = {
        id: Date.now(),
        numero_de_corredores,
        distancia_recorrida,
        corredores: Array.from({ length: numero_de_corredores }, (_, i) => ({
            id: i + 1,
            velocidad: Math.floor(Math.random() * 20) + 1,
            posicion: 0,
        })),
        posiciones: [],
    };

    const db = leer_bdd();
    db.carreras.push(carrera);
    escribir_bdd(db);
    res.status(201).send(carrera);
});

/**
 * PUT /carreras/:id
 * Simula el avance de una carrera por ID.
 * URL: http://localhost:3000/carreras/:id
 */
app.put('/carreras/:id', (req, res) => {
    const { id } = req.params;
    const db = leer_bdd();
    const carrera = db.carreras.find((c) => c.id === parseInt(id));

    if (!carrera) {
        return res.status(404).send('Carrera no encontrada.');
    }

    carrera.corredores.forEach((corredor) => {
        corredor.posicion += corredor.velocidad;
    });

    const completados = carrera.corredores.filter(
        (corredor) => corredor.posicion >= carrera.distancia_recorrida
    );

    if (completados.length > 0 && carrera.posiciones.length === 0) {
        completados.sort((a, b) => b.posicion - a.posicion);
        carrera.posiciones = completados.slice(0, 3).map((corredor, index) => {
            const lugar = index === 0 ? 'Primero' : index === 1 ? 'Segundo' : 'Tercero';
            return { lugar, corredor: corredor.id };
        });
    }

    escribir_bdd(db);

    const resultados = carrera.posiciones.length
        ? {
            resultados: {
                estado: 'Carrera completada',
                ganadores: carrera.posiciones.map((p) => ({
                    lugar: p.lugar,
                    corredor: `Corredor ${p.corredor}`
                }))
            }
        }
        : {
            resultados: {
                estado: 'Carrera en progreso',
                corredores: carrera.corredores.map((corredor) => ({
                    corredor: `Corredor ${corredor.id}`,
                    posicion: `${corredor.posicion} km`
                }))
            }
        };

    res.send({ carrera, ...resultados });
});

/**
 * GET /carreras
 * Obtiene todas las carreras.
 * URL: http://localhost:3000/carreras
 */
app.get('/carreras', (_, res) => {
    const db = leer_bdd();
    res.send(db.carreras);
});

/**
 * DELETE /carreras/:id
 * Elimina una carrera por ID.
 * URL: http://localhost:3000/carreras/:id
 */
app.delete('/carreras/:id', (req, res) => {
    const { id } = req.params;
    const db = leer_bdd();
    const nuevaBase = db.carreras.filter((c) => c.id !== parseInt(id));

    if (nuevaBase.length === db.carreras.length) {
        return res.status(404).send('Carrera no encontrada.');
    }

    escribir_bdd({ carreras: nuevaBase });
    res.send('Carrera eliminada exitosamente.');
});

/**
 * ALL /info
 * Responde a cualquier método HTTP en la ruta /info.
 * URL: http://localhost:3000/all
 */
app.all('/all', (req, res) => {
    res.send(`Se recibió una solicitud ${req.method} en la ruta /info.`);
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
    console.log('Escuchando a través del puerto 3000');
});
