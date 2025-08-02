import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './theme-provider.jsx'

// --- CÓDIGO PARA VERIFICAR VERSÃO E LIMPAR DADOS ---

// 1. Defina a versão atual do seu site aqui.
//    Toda vez que você fizer uma grande atualização, MUDE ESTE NÚMERO (ex: para '1.0.2').
const SUA_VERSAO_ATUAL = '1.0.2';

// 2. Este código faz a mágica acontecer. Não precisa mexer aqui.
try {
  // Pega a versão que está salva no navegador do usuário.
  const versaoSalva = localStorage.getItem('versao_do_site');

  // Compara a sua versão atual com a que estava salva.
  if (versaoSalva !== SUA_VERSAO_ATUAL) {
    // Se forem diferentes, limpa tudo que estava salvo.
    localStorage.clear();
    // Salva a sua nova versão no navegador do usuário.
    localStorage.setItem('versao_do_site', SUA_VERSAO_ATUAL);
    // Mostra uma mensagem no console do navegador (útil para você ver se funcionou).
    console.log('Site atualizado! O armazenamento local foi limpo.');
  }
} catch (e) {
  // Ignora erros caso o usuário tenha bloqueado o localStorage.
  console.error('Falha ao verificar a versão do site.', e);
}

// --- FIM DO CÓDIGO DE VERIFICAÇÃO ---


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
