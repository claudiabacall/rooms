// src/lib/lifestyleQuestions.js

/**
 * Sólo datos puros: id, texto y valore de cada opción.
 * No hay ningún import de iconos ni JSX.
 */
export const lifestyleQuestions = [
    {
        id: 'fiesta',
        text: '¿Te gusta la fiesta en casa?',
        options: [
            { value: 'nunca', label: 'Ni en broma' },
            { value: 'a_veces', label: '¡A veces sí!' },
        ],
    },
    {
        id: 'mascotas',
        text: '¿Qué tal con las mascotas?',
        options: [
            { value: 'sin_mascotas', label: 'Prefiero sin' },
            { value: 'encantan', label: '¡Me encantan!' },
        ],
    },
    {
        id: 'orden',
        text: '¿Eres ordenado/a?',
        options: [
            { value: 'no_mucho', label: 'No mucho' },
            { value: 'bastante', label: 'Bastante' },
        ],
    },
    {
        id: 'humo',
        text: '¿Te molesta el humo?',
        options: [
            { value: 'no_importa', label: 'No me importa' },
            { value: 'molesta', label: 'Sí, me molesta' },
        ],
    },
    {
        id: 'visitas',
        text: '¿Sueles recibir visitas?',
        options: [
            { value: 'casi_nunca', label: 'Casi nunca' },
            { value: 'a_menudo', label: 'Sí, a menudo' },
        ],
    },
    {
        id: 'cocinas',
        text: '¿Cocinas en casa?',
        options: [
            { value: 'muy_poco', label: 'Muy poco' },
            { value: 'cada_dia', label: 'Casi cada día' },
        ],
    },
];
