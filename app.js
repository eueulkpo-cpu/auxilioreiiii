// ============================================
// AUXILIO — Web App
// Senha fixa: 202
// ============================================

const SENHA_CORRETA = "202";
const CHAVE_CONFIG = "auxilio_config";

// ---------- Estado ----------
let config = {
  legit: false,
  inputLag: false,
  recuo: false,
};

// ---------- Persistência ----------
function carregarConfig() {
  try {
    const salvo = localStorage.getItem(CHAVE_CONFIG);
    if (salvo) config = { ...config, ...JSON.parse(salvo) };
  } catch (e) {
    console.error("Erro carregando config:", e);
  }
}

function salvarConfig() {
  try {
    localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error("Erro salvando config:", e);
  }
}

// ---------- Referências DOM ----------
const telaLogin = document.getElementById("telaLogin");
const telaFuncoes = document.getElementById("telaFuncoes");
const inputSenha = document.getElementById("inputSenha");
const btnLogin = document.getElementById("btnLogin");
const txtErro = document.getElementById("txtErro");
const btnSair = document.getElementById("btnSair");

// ---------- Login ----------
function fazerLogin() {
  const senha = inputSenha.value.trim();

  if (!senha) {
    txtErro.textContent = "Digite a senha";
    return;
  }

  if (senha !== SENHA_CORRETA) {
    txtErro.textContent = "Senha incorreta";
    inputSenha.value = "";
    inputSenha.focus();
    return;
  }

  txtErro.textContent = "";
  inputSenha.value = "";
  abrirFuncoes();
}

function abrirFuncoes() {
  telaLogin.classList.add("oculto");
  telaFuncoes.classList.add("visivel");
  atualizarToggles();
}

function voltarLogin() {
  telaFuncoes.classList.remove("visivel");
  telaLogin.classList.remove("oculto");
  inputSenha.focus();
}

btnLogin.addEventListener("click", fazerLogin);

inputSenha.addEventListener("keydown", (e) => {
  if (e.key === "Enter") fazerLogin();
});

btnSair.addEventListener("click", voltarLogin);

// ---------- Toggles ----------
function atualizarToggles() {
  Object.keys(config).forEach((id) => {
    const sw = document.getElementById("sw-" + id);
    if (sw) {
      if (config[id]) sw.classList.add("on");
      else sw.classList.remove("on");
    }
  });
}

document.querySelectorAll(".row").forEach((row) => {
  row.addEventListener("click", () => {
    const funcao = row.dataset.funcao;
    if (!funcao) return;

    config[funcao] = !config[funcao];
    salvarConfig();
    atualizarToggles();

    // Vibração leve (feedback tátil)
    if (navigator.vibrate) navigator.vibrate(20);
  });
});

// ---------- Registrar Service Worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then(() => console.log("✅ Service Worker registrado"))
      .catch((e) => console.error("❌ SW erro:", e));
  });
}

// ---------- Inicializar ----------
carregarConfig();
atualizarToggles();
inputSenha.focus();
