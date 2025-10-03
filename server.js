const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

const PASTA_JOGOS = "F:/XboxGames"; // caminho da pasta
const EXTENSOES = ['.txt', '.manifest', '.zip', '.lua', '.json', '.exe'];

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/buscar', (req, res) => {
  const { gameId } = req.body;
  if (!gameId) return res.json({ encontrado: false, msg: 'ID não informado' });

  try {
    const arquivos = fs.readdirSync(PASTA_JOGOS);
    const arquivoEncontrado = arquivos.find(arquivo => 
      EXTENSOES.some(ext => arquivo.toLowerCase() === `${gameId}${ext}`)
    );

    if (arquivoEncontrado) {
      const caminhoArquivo = path.join(PASTA_JOGOS, arquivoEncontrado);
      // Envia arquivo para download
      return res.download(caminhoArquivo, arquivoEncontrado);
    } else {
      res.json({ encontrado: false, msg: `❌ Nenhum arquivo com ID ${gameId} foi encontrado.` });
    }
  } catch (err) {
    res.json({ encontrado: false, msg: `Erro ao acessar a pasta: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
