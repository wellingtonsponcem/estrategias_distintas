import fs from 'fs';

function addLogout(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Normalizar quebras de linha para busca
  const hasCRLF = content.includes('\r\n');

  // 1. Welcome Screen Header
  const target1 = 'Pular ✕';
  if (content.includes(target1) && !content.includes('handleStrategyLogout')) {
    const welcomeBtnLogout = `
        <button onclick="handleStrategyLogout()" class="text-xs font-medium px-3.5 py-1.5 rounded-full bg-rose-500/25 hover:bg-rose-500/40 text-rose-300 hover:text-rose-200 transition backdrop-blur-md border border-rose-500/40 flex items-center gap-1" title="Encerrar sessão e voltar ao login">
          <span>Sair</span> <span>⎋</span>
        </button>`;
    
    // Inserir após o botão Pular
    content = content.replace(/(<button onclick="dismissWelcomeScreen\(\)"[^>]*>[\s\S]*?Pular ✕[\s\S]*?<\/button>)/, `$1${welcomeBtnLogout}`);
  }

  // 2. Navbar Principal
  const target2 = 'presentBtn';
  if (content.includes(target2)) {
    const navBtnLogout = `
        <button onclick="handleStrategyLogout()" class="text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-300/60 hover:bg-rose-500/20 transition flex items-center gap-1" title="Encerrar sessão e voltar ao login">
          <span>Sair</span> <span>⎋</span>
        </button>`;
    
    content = content.replace(/(<button id="presentBtn"[^>]*>[\s\S]*?<\/button>)/, `$1${navBtnLogout}`);
  }

  // 3. Script com a função global de logout
  if (!content.includes('function handleStrategyLogout')) {
    const scriptLogout = `
  <script>
    function handleStrategyLogout() {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  </script>
</body>`;
    content = content.replace('</body>', scriptLogout);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Botão de logout adicionado com sucesso em: ${filePath}`);
}

addLogout('public/estrategias/kelly-loganima.html');
addLogout('dist/index.html');
addLogout('index.html');
