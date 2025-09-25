/**
 * app.js - Lógica principal do Quiz Jornada da Saúde
 *
 * Este arquivo contém a lógica principal do aplicativo, incluindo:
 * - Gerenciamento de telas e navegação
 * - Lógica do quiz (perguntas, respostas, pontuação)
 * - Timer e progresso
 */

// Variáveis globais
let currentUser = '';
let currentModule = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
let quizStartTime = null;
let quizTimer = null;
let quizSeconds = 0;

// Novas variáveis para navegação livre
let userAnswers = {}; // Armazena as respostas do usuário {questionIndex: selectedIndex}
let questionStates = {}; // Armazena estados das questões {questionIndex: 'answered'|'current'|'unanswered'}

// Elementos DOM
const screens = {
    login: document.getElementById('login-screen'),
    moduleSelection: document.getElementById('module-selection-screen'),
    quiz: document.getElementById('quiz-screen'),
    review: document.getElementById('review-screen')
};

// Inicialização
document.addEventListener('DOMContentLoaded', init);

/**
 * Inicializa o aplicativo
 */
async function init() {
    try {
        // Define o título do quiz
        document.getElementById('quiz-subject-title').textContent = quizConfig.title;
        document.title = quizConfig.title;

        // Carrega as questões
        await loadAllQuestions();
        console.log('Questões carregadas com sucesso');

        // Sempre inicia na tela de login
        showLoginScreen();

        // Configura os event listeners
        setupEventListeners();

        // Popula a lista de módulos
        populateModuleList();

    } catch (error) {
        console.error('Erro ao inicializar o aplicativo:', error);
        alert('Ocorreu um erro ao carregar o aplicativo. Por favor, recarregue a página.');
    }
}

/**
 * Popula a lista de módulos na tela de seleção
 */
function populateModuleList() {
    const moduleList = document.getElementById('module-list');
    moduleList.innerHTML = '';

    quizConfig.modules.forEach(module => {
        const button = document.createElement('button');
        button.className = 'list-group-item list-group-item-action module-btn';
        button.dataset.module = module.id;

        const progress = calculateModuleProgress(module.id);

        button.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${module.name}</span>
                <span class="badge bg-primary rounded-pill module-progress" data-module="${module.id}">${progress}%</span>
            </div>
        `;

        button.addEventListener('click', () => startQuiz(module.id));

        moduleList.appendChild(button);
    });
}

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
    // Login screen
    document.getElementById('enter-system-btn').addEventListener('click', showModuleSelectionScreen);

    // Module selection
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Quiz
    document.getElementById('quit-quiz-btn').addEventListener('click', quitQuiz);
    document.getElementById('finish-quiz-btn').addEventListener('click', finishQuiz);
    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);

    // Review
    document.getElementById('retry-module-btn').addEventListener('click', () => startQuiz(currentModule));
    document.getElementById('return-to-modules-btn').addEventListener('click', showModuleSelectionScreen);

    // Configura o salvamento automático
    window.addEventListener('beforeunload', saveUserData);
}

/**
 * Manipula o logout do usuário
 */
function handleLogout() {
    currentUser = '';
    showLoginScreen();
}

/**
 * Mostra a tela de login
 */
function showLoginScreen() {
    hideAllScreens();
    screens.login.classList.remove('d-none');
}

/**
 * Mostra a tela de seleção de módulos
 */
function showModuleSelectionScreen() {
    hideAllScreens();
    screens.moduleSelection.classList.remove('d-none');

    // Atualiza o progresso dos módulos
    updateModuleProgress();
}

/**
 * Atualiza o progresso exibido para cada módulo
 */
function updateModuleProgress() {
    // Atualiza o progresso de cada módulo
    document.querySelectorAll('.module-progress').forEach(element => {
        const module = element.dataset.module;
        const progress = calculateModuleProgress(module);
        element.textContent = `${progress}%`;

        // Atualiza a cor baseada no progresso
        if (progress >= 80) {
            element.classList.remove('bg-primary', 'bg-warning');
            element.classList.add('bg-success');
        } else if (progress >= 40) {
            element.classList.remove('bg-primary', 'bg-success');
            element.classList.add('bg-warning');
        } else {
            element.classList.remove('bg-warning', 'bg-success');
            element.classList.add('bg-primary');
        }
    });

    // Atualiza o progresso geral
    const overallProgress = calculateOverallProgress();
    document.getElementById('overall-progress').textContent = `${overallProgress}%`;
    document.getElementById('overall-progress-bar').style.width = `${overallProgress}%`;

    // Atualiza a cor do progresso geral
    const progressBar = document.getElementById('overall-progress-bar');
    if (overallProgress >= 80) {
        progressBar.className = 'progress-bar bg-success';
    } else if (overallProgress >= 40) {
        progressBar.className = 'progress-bar bg-warning';
    } else {
        progressBar.className = 'progress-bar bg-primary';
    }
}

/**
 * Inicia o quiz para um módulo específico
 * @param {string} module - ID do módulo
 */
function startQuiz(module) {
    currentModule = module;

    // Obtém as questões do módulo
    currentQuestions = getModuleQuestions(module);

    if (currentQuestions.length === 0) {
        console.error('No questions found for module:', module);
        alert('Erro: Nenhuma questão encontrada para este módulo. Verifique se o arquivo JSON foi carregado corretamente.');
        return;
    }

    // Reinicia as variáveis do quiz
    currentQuestionIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;

    // Reinicia os dados de navegação livre
    userAnswers = {};
    questionStates = {};

    // Inicializa estados das questões
    for (let i = 0; i < currentQuestions.length; i++) {
        questionStates[i] = 'unanswered';
    }
    questionStates[0] = 'current';

    // Mostra a tela do quiz
    showQuizScreen();

    // Inicia o timer
    startTimer();

    // Gera a navegação de questões
    generateQuestionNavigation();

    // Carrega a primeira questão
    loadQuestion();
}

/**
 * Gera a barra de navegação das questões
 */
function generateQuestionNavigation() {
    const navWrapper = document.querySelector('.question-nav-wrapper');
    navWrapper.innerHTML = '';

    for (let i = 0; i < currentQuestions.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'question-nav-btn';
        btn.textContent = i + 1;
        btn.dataset.questionIndex = i;

        btn.addEventListener('click', () => navigateToQuestion(i));

        navWrapper.appendChild(btn);
    }

    updateNavigationStates();
}

/**
 * Atualiza os estados visuais da navegação
 */
function updateNavigationStates() {
    const navButtons = document.querySelectorAll('.question-nav-btn');

    navButtons.forEach((btn, index) => {
        btn.className = 'question-nav-btn';

        if (questionStates[index] === 'current') {
            btn.classList.add('current');
        } else if (questionStates[index] === 'answered') {
            btn.classList.add('answered');
        }
    });

    // Atualiza contador de respondidas
    const answeredCount = Object.keys(userAnswers).length;
    document.getElementById('answered-count').textContent = `Respondidas: ${answeredCount}/${currentQuestions.length}`;
}

/**
 * Navega para uma questão específica
 * @param {number} questionIndex - Índice da questão
 */
function navigateToQuestion(questionIndex) {
    // Atualiza estados
    questionStates[currentQuestionIndex] = userAnswers[currentQuestionIndex] !== undefined ? 'answered' : 'unanswered';
    questionStates[questionIndex] = 'current';
    currentQuestionIndex = questionIndex;

    // Carrega a questão
    loadQuestion();

    // Atualiza navegação
    updateNavigationStates();
}

/**
 * Avança para a próxima questão sem exigir resposta
 */
function nextQuestion() {
    // Verifica se não estamos na última questão
    if (currentQuestionIndex < currentQuestions.length - 1) {
        navigateToQuestion(currentQuestionIndex + 1);
    }
}

/**
 * Mostra a tela do quiz
 */
function showQuizScreen() {
    hideAllScreens();
    screens.quiz.classList.remove('d-none');

    // Define o título do quiz baseado no módulo atual
    const moduleConfig = quizConfig.modules.find(m => m.id === currentModule);
    const title = moduleConfig ? moduleConfig.name : currentModule;

    document.getElementById('quiz-title').textContent = title;

    // Reinicia o contador de respostas
    document.getElementById('answered-count').textContent = `Respondidas: 0/${currentQuestions.length}`;
}

/**
 * Carrega uma questão
 */
function loadQuestion() {
    const question = currentQuestions[currentQuestionIndex];

    if (!question) {
        console.error('No question found at index:', currentQuestionIndex);
        return;
    }

    displayQuestion(question);

    // Atualiza o número da questão
    document.getElementById('question-number').textContent = `Questão ${currentQuestionIndex + 1}/${currentQuestions.length}`;

    // Atualiza o tipo da questão
    document.getElementById('question-type').textContent = question.type === 'conteudista' ? 'Conteudista' : 'Raciocínio';

    // Atualiza a barra de progresso baseada nas questões respondidas
    const answeredCount = Object.keys(userAnswers).length;
    const progress = (answeredCount / currentQuestions.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;

    // Mostra/esconde botões de navegação baseado na posição da questão
    const finishContainer = document.getElementById('finish-quiz-container');
    const nextQuestionContainer = document.getElementById('next-question-container');

    if (currentQuestionIndex === currentQuestions.length - 1) {
        // Última questão: mostra botão finalizar, esconde próxima questão
        finishContainer.classList.remove('d-none');
        nextQuestionContainer.classList.add('d-none');
    } else {
        // Não é a última questão: esconde botão finalizar, mostra próxima questão
        finishContainer.classList.add('d-none');
        nextQuestionContainer.classList.remove('d-none');
    }

    // Se a questão já foi respondida, pré-seleciona a resposta
    if (userAnswers[currentQuestionIndex] !== undefined) {
        const selectedIndex = userAnswers[currentQuestionIndex];
        const optionButtons = document.querySelectorAll('.option-btn');
        if (optionButtons[selectedIndex]) {
            optionButtons[selectedIndex].classList.add('selected');
        }
    }
}

/**
 * Exibe uma questão na tela
 * @param {Object} question - Objeto da questão
 */
function displayQuestion(question) {
    // Exibe o texto da questão
    document.getElementById('question-text').textContent = question.question;

    // Limpa o container de opções
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    // Adiciona as opções
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-secondary w-100 option-btn';
        button.dataset.option = index;
        button.dataset.index = index;
        button.textContent = option;

        button.addEventListener('click', () => handleAnswer(index));

        optionsContainer.appendChild(button);
    });

    // Mostra o container de questão
    document.getElementById('question-container').classList.remove('d-none');
}

/**
 * Manipula a resposta do usuário
 * @param {number} selectedIndex - Índice da opção selecionada
 */
function handleAnswer(selectedIndex) {
    // Remove seleção anterior
    const optionButtons = document.querySelectorAll('.option-btn');
    optionButtons.forEach(btn => btn.classList.remove('selected'));

    // Marca a nova seleção
    optionButtons[selectedIndex].classList.add('selected');

    // Armazena a resposta do usuário
    userAnswers[currentQuestionIndex] = selectedIndex;

    // Atualiza estado da questão
    questionStates[currentQuestionIndex] = 'answered';

    // Atualiza navegação visual
    updateNavigationStates();

    // Atualiza progresso na barra
    const answeredCount = Object.keys(userAnswers).length;
    const progress = (answeredCount / currentQuestions.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;
}

/**
 * Finaliza o quiz e mostra a tela de revisão
 */
function finishQuiz() {
    stopTimer();
    calculateFinalResults();
    showReviewScreen();
}

/**
 * Abandona o quiz atual e volta para a seleção de módulos
 */
function quitQuiz() {
    if (confirm('Tem certeza que deseja sair do quiz? Seu progresso será salvo.')) {
        stopTimer();
        showModuleSelectionScreen();
    }
}

/**
 * Calcula os resultados finais do quiz
 */
function calculateFinalResults() {
    correctAnswers = 0;
    incorrectAnswers = 0;

    // Conta respostas corretas e incorretas
    for (let i = 0; i < currentQuestions.length; i++) {
        if (userAnswers[i] !== undefined) {
            const question = currentQuestions[i];
            if (userAnswers[i] === question.correctIndex) {
                correctAnswers++;
            } else {
                incorrectAnswers++;
            }
        }
    }
}

/**
 * Mostra a tela de revisão completa
 */
function showReviewScreen() {
    hideAllScreens();
    screens.review.classList.remove('d-none');

    // Calcula a pontuação
    const totalQuestions = correctAnswers + incorrectAnswers;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Atualiza elementos da tela de revisão
    document.getElementById('final-score-circle').textContent = `${scorePercentage}%`;
    document.getElementById('final-correct-count').textContent = correctAnswers;
    document.getElementById('final-incorrect-count').textContent = incorrectAnswers;
    document.getElementById('final-total-time').textContent = formatTime(quizSeconds);
    document.getElementById('final-score-percentage').textContent = `${scorePercentage}%`;

    // Determina nível de desempenho
    let performanceLevel = '';
    if (scorePercentage >= 90) {
        performanceLevel = 'Excelente';
    } else if (scorePercentage >= 80) {
        performanceLevel = 'Muito Bom';
    } else if (scorePercentage >= 70) {
        performanceLevel = 'Bom';
    } else if (scorePercentage >= 60) {
        performanceLevel = 'Regular';
    } else {
        performanceLevel = 'Precisa Melhorar';
    }
    document.getElementById('performance-level').textContent = performanceLevel;

    // Gera a revisão das questões
    generateQuestionReview();
}

/**
 * Gera a revisão detalhada de todas as questões
 */
function generateQuestionReview() {
    const container = document.getElementById('review-questions-container');
    container.innerHTML = '';

    currentQuestions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correctIndex;
        const wasAnswered = userAnswer !== undefined;

        const questionDiv = document.createElement('div');
        questionDiv.className = 'review-question';

        questionDiv.innerHTML = `
            <div class="review-question-header">
                <div class="d-flex justify-content-between align-items-center w-100">
                    <div class="d-flex align-items-center">
                        <div class="question-result-icon ${isCorrect ? 'correct' : 'incorrect'} me-3">
                            ${isCorrect ? '✓' : '✗'}
                        </div>
                        <div>
                            <h5 class="mb-1">Questão ${index + 1}</h5>
                            <small class="text-muted">${question.type === 'conteudista' ? 'Conteudista' : 'Raciocínio'}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        ${wasAnswered ? (isCorrect ? '<span class="badge bg-success">Correta</span>' : '<span class="badge bg-danger">Incorreta</span>') : '<span class="badge bg-secondary">Não Respondida</span>'}
                    </div>
                </div>
            </div>

            <div class="question-content">
                <p class="fw-bold mb-3">${question.question}</p>

                <div class="review-options">
                    ${question.options.map((option, optIndex) => {
                        let classes = 'review-option';

                        if (optIndex === question.correctIndex) {
                            classes += ' correct-answer';
                        }

                        if (optIndex === userAnswer) {
                            classes += ' user-answer';
                            if (!isCorrect) {
                                classes += ' incorrect';
                            }
                        }

                        return `<div class="${classes}">
                            ${optIndex === userAnswer ? '<i class="fas fa-arrow-right me-2"></i>' : ''}
                            ${optIndex === question.correctIndex ? '<i class="fas fa-check text-success me-2"></i>' : ''}
                            ${option}
                        </div>`;
                    }).join('')}
                </div>

                <div class="review-explanation">
                    <h6><i class="fas fa-lightbulb me-2"></i>Explicação</h6>
                    <p class="mb-0">${question.explanation}</p>
                </div>
            </div>
        `;

        container.appendChild(questionDiv);
    });
}

/**
 * Esconde todas as telas
 */
function hideAllScreens() {
    Object.values(screens).forEach(screen => {
        screen.classList.add('d-none');
    });
}

/**
 * Inicia o timer do quiz
 */
function startTimer() {
    quizStartTime = new Date();
    quizSeconds = 0;

    // Atualiza o timer a cada segundo
    quizTimer = setInterval(() => {
        quizSeconds++;
        document.getElementById('timer').innerHTML = `<i class="fas fa-clock me-1"></i>${formatTime(quizSeconds)}`;
    }, 1000);
}

/**
 * Para o timer do quiz
 */
function stopTimer() {
    clearInterval(quizTimer);
}

/**
 * Formata o tempo em segundos para o formato MM:SS
 * @param {number} seconds - Tempo em segundos
 * @returns {string} Tempo formatado
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Embaralha um array (algoritmo Fisher-Yates)
 * @param {Array} array - Array a ser embaralhado
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}