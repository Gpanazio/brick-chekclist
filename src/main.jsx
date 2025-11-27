import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './theme-provider.jsx'
import { Toaster } from '@/components/ui/sonner.jsx'

// --- CÓDIGO PARA VERIFICAR VERSÃO E LIMPAR DADOS ---

// Atualizei para 1.0.6 para forçar o navegador a baixar a versão nova
const SUA_VERSAO_ATUAL = '1.0.6';

try {
  const versaoSalva = localStorage.getItem('versao_do_site');
  if (versaoSalva !== SUA_VERSAO_ATUAL) {
    // Se a versão mudou, limpamos o cache do localStorage
    // Isso não apaga os dados do Supabase, apenas configurações locais
    localStorage.clear();
    localStorage.setItem('versao_do_site', SUA_VERSAO_ATUAL);
    console.log('Cache limpo! Versão atualizada para ' + SUA_VERSAO_ATUAL);
  }
} catch (e) {
  console.error('Erro ao verificar versão.', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
)
