const express = require('express');
const fs = require('fs');
const path = require('path');
// Importação do bcrypt removida. Não há mais hashing de senha.
const app = express();
const PORT = 3000;

// --- Configurações do Sistema de Usuário ---
const USERS_FILE = path.join(__dirname, 'data', 'users.json'); 

// --- Configurações do Sistema de Jogos (Seu Código Original) ---
// ATENÇÃO: Verifique se este caminho existe ou altere-o
const PASTA_JOGOS = "F:/XboxGames"; 
const EXTENSOES = ['.txt', '.manifest', '.zip', '.lua', '.json', '.exe'];

// --- Inicialização e Middleware ---

// 1. VITAL: Middleware para analisar corpos de requisição JSON
// Deve vir antes de todas as rotas que consomem JSON (Login, Signup, Buscar)
app.use(express.json());

// 2. Middleware para analisar corpos de requisição POST com URL-encoded
app.use(express.urlencoded({ extended: true }));

// 3. Rota raiz para servir o formulário HTML (Arquivos estáticos)
app.use(express.static(path.join(__dirname, 'public')));


// Verifica se a pasta 'data' existe e a cria se não existir
// Também inicializa o arquivo 'users.json' se ele não existir
function initializeUserFile() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    if (!fs.existsSync(USERS_FILE)) {
        // Inicializa com um objeto vazio se o arquivo não existir
        fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2));
    }
}

// Carrega os dados dos usuários do arquivo JSON
function loadUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Se o arquivo não existir ou for inválido, inicializa e retorna objeto vazio
        initializeUserFile();
        return {}; 
    }
}

// Salva os dados dos usuários no arquivo JSON
function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao salvar usuários:', error);
    }
}

// Inicializa o arquivo de usuários ao iniciar o servidor
initializeUserFile(); 

// --- ROTA DE REGISTRO (SIGNUP) ---
app.post('/signup', (req, res) => {
    // Agora req.body está definido por causa do express.json()
    const { username, password, nickname } = req.body; // Linha 99 original

    if (!username || !password) {
        return res.status(400).json({ success: false, msg: 'Email (username) e senha são obrigatórios.' });
    }

    const users = loadUsers();

    if (users[username]) {
        return res.status(409).json({ success: false, msg: 'Usuário (Email) já existe.' });
    }

    try {
        // Ação: Salva a senha em TEXTO PURO (conforme seu código original)
        users[username] = {
            password: password, // <-- Senha salva em texto puro
            nickname: nickname || username, // Salva o nickname
            createdAt: new Date().toISOString()
        };

        saveUsers(users);
        
        // Retorna JSON para o frontend processar
        res.status(201).json({ success: true, msg: `Conta criada com sucesso! Você pode fazer login agora.` });

    } catch (error) {
        console.error('Erro no signup:', error);
        res.status(500).json({ success: false, msg: 'Erro interno ao registrar.' });
    }
});

// --- ROTA DE LOGIN ---
app.post('/login', (req, res) => {
    // Agora req.body está definido
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, msg: 'Nome de usuário e senha são obrigatórios.' });
    }

    const users = loadUsers();
    const user = users[username];

    if (!user) {
        return res.status(401).json({ success: false, msg: 'Usuário não encontrado ou senha incorreta.' });
    }

    try {
        // Compara a senha informada com a senha salva em TEXTO PURO.
        const match = password === user.password; 

        if (match) {
            // Login bem-sucedido - Retorna JSON
            res.status(200).json({ success: true, msg: `Login bem-sucedido! Bem-vindo(a), ${user.nickname || username}.` });
        } else {
            // Senha incorreta - Retorna JSON
            res.status(401).json({ success: false, msg: 'Usuário não encontrado ou senha incorreta.' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ success: false, msg: 'Erro interno ao tentar fazer login.' });
    }
});


// ----------------------------------------------------------------
// CORREÇÃO: MUDANÇA DE GET PARA POST E DE REQ.QUERY PARA REQ.BODY
// ----------------------------------------------------------------
// --- ROTA DE BUSCA DE JOGOS ---
app.post('/buscar', (req, res) => {
  // Pega o dado de req.body, pois o frontend está fazendo um POST com JSON
  const { gameId } = req.body; 
  if (!gameId) return res.status(400).json({ encontrado: false, msg: 'ID do Jogo não informado.' });

  try {
    const arquivos = fs.readdirSync(PASTA_JOGOS);
    const arquivoEncontrado = arquivos.find(arquivo => 
      EXTENSOES.some(ext => arquivo.toLowerCase() === `${gameId.toLowerCase()}${ext}`.toLowerCase())
    );

    if (arquivoEncontrado) {
      const caminhoArquivo = path.join(PASTA_JOGOS, arquivoEncontrado);
      // Envia arquivo para download
      return res.download(caminhoArquivo, arquivoEncontrado);
    } else {
      // Retorna JSON para o frontend tratar a mensagem de erro.
      res.status(404).json({ encontrado: false, msg: `Nenhum arquivo com ID ${gameId} foi encontrado na pasta.` });
    }
  } catch (err) {
    // Retorna JSON para o frontend tratar o erro de acesso à pasta.
    res.status(500).json({ encontrado: false, msg: `Erro ao acessar a pasta de jogos: ${err.message}` });
  }
});


// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Arquivo de usuários: ${USERS_FILE}`);
});