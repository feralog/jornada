/**
 * config.js - Configurações do Quiz Jornada da Saúde
 *
 * Este arquivo contém as configurações personalizáveis do quiz.
 * Altere estas configurações para adaptar o quiz à sua matéria.
 */

// Configuração do quiz
const quizConfig = {
    // Título principal que aparece na tela de login
    title: "Quiz Jornada da Saúde",

    // Nome do localStorage para salvar os dados do usuário
    storageKey: "jornadaSaudeQuizData",

    // Módulos disponíveis para a Jornada da Saúde
    modules: [
        {
            id: "historia",
            name: "História",
            file: "historia"
        },
        {
            id: "desacusias",
            name: "Desacusias",
            file: "Desacusias"
        },
        {
            id: "lombalgia",
            name: "Lombalgia",
            file: "lombalgia"
        },
        {
            id: "dislipidemias",
            name: "Dislipidemias",
            file: "dislipidemias"
        }
    ]
};