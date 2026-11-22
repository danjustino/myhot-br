// Quais modelos este site usa. O framework já traz um `default`: o modelo definido pelas variáveis LLM_BASE_URL / LLM_API_KEY / LLM_MODEL.
// Aqui ficam os modelos com nome (cada um com seu endereço e variáveis de chave) e qual cada etapa usa por padrão; etapas não listadas usam default.
// No deploy, ainda dá para trocar etapa por etapa com variáveis de ambiente (PREFILTER_MODEL, SCORE_MODEL…) ou na página "Modelos e avaliação" do painel.

import type { ModelPreset } from "@aihot/contracts/site-config";
export type { ModelPreset } from "@aihot/contracts/site-config";

/** Exemplos de modelos com nome (cada um precisa da sua chave). Pode apagar os que não usar. */
export const PRESETS: Record<string, ModelPreset> = {
  // GLM 5.3 Flash always reasons; the lowest effort keeps short structured tasks fast.
  "glm-5.3-flash": {
    service: "zhipu", model: "glm-5.3-flash", baseUrlEnv: "ZHIPU_BASE_URL", apiKeyEnv: "ZHIPU_API_KEY",
    extra: { thinking: { type: "enabled" }, reasoning_effort: "low" }, jsonMode: true, vision: true,
  },
  // The scorer's parameters for glm-5.3-flash: temperature 1 with high reasoning, up to 180 s per call.
  "glm-5.3-flash-selection": {
    service: "zhipu", model: "glm-5.3-flash", baseUrlEnv: "ZHIPU_BASE_URL", apiKeyEnv: "ZHIPU_API_KEY",
    extra: { thinking: { type: "enabled", clear_thinking: false }, reasoning_effort: "high", top_p: 0.95 }, jsonMode: true, vision: true,
    scoreCall: { temperature: 1, maxTokens: 65_536, timeoutMs: 180_000 },
  },
  // DeepSeek Flash reasons by default; structured tasks switch it off. deepseek-flash-think keeps it on,
  // with room in the output for the reasoning.
  "deepseek-flash": {
    service: "deepseek", model: "deepseek-flash", baseUrlEnv: "DEEPSEEK_BASE_URL", apiKeyEnv: "DEEPSEEK_API_KEY",
    extra: { thinking: { type: "disabled" } }, jsonMode: true,
  },
  "deepseek-flash-think": {
    service: "deepseek", model: "deepseek-flash", baseUrlEnv: "DEEPSEEK_BASE_URL", apiKeyEnv: "DEEPSEEK_API_KEY", reasoningTokens: 4000, jsonMode: true,
  },
  "qwen3.7-flash": {
    service: "dashscope", model: "qwen3.7-flash", baseUrlEnv: "DASHSCOPE_BASE_URL", apiKeyEnv: "DASHSCOPE_API_KEY",
    extra: { enable_thinking: false }, jsonMode: true,
  },
  "qwen3.8-flash": {
    service: "dashscope", model: "qwen3.8-flash", baseUrlEnv: "DASHSCOPE_BASE_URL", apiKeyEnv: "DASHSCOPE_API_KEY",
    extra: { enable_thinking: false }, jsonMode: true,
  },
  "mimo-v2.6-flash": {
    service: "mimo", model: "mimo-v2.6-flash", baseUrlEnv: "XIAOMI_MIMO_BASE_URL", apiKeyEnv: "XIAOMI_MIMO_API_KEY",
    extra: { thinking: { type: "disabled" } }, jsonMode: true,
  },
  // Planos gratuitos (o provedor pode usar os textos enviados para treinar os modelos dele; aqui só vão notícias públicas).
  // Mistral: plano Experiment do console. Os aliases -latest acompanham a versão atual de cada modelo.
  "mistral-small": {
    service: "mistral", model: "mistral-small-latest", baseUrlEnv: "MISTRAL_BASE_URL", apiKeyEnv: "MISTRAL_API_KEY", jsonMode: true,
  },
  // Gemini Flash-Lite: grátis no AI Studio, sem raciocínio por padrão.
  "gemini-flash-lite": {
    service: "gemini", model: "gemini-flash-lite-latest", baseUrlEnv: "GEMINI_BASE_URL", apiKeyEnv: "GEMINI_API_KEY", jsonMode: true,
  },
  // Modelo local (Ollama na própria máquina, sem custo). Leve o bastante para uma GPU de 8 GB; serve às
  // etapas que leem muito e respondem pouco (pré-triagem e pontuação). Mais lento: a pontuação ganha 5 min por chamada.
  local: {
    service: "ollama", model: "qwen2.5:7b", baseUrlEnv: "LOCAL_LLM_BASE_URL", apiKeyEnv: "LOCAL_LLM_API_KEY", jsonMode: true,
    scoreCall: { temperature: 0.2, maxTokens: 1024, timeoutMs: 300_000 },
  },
  "qwen3-vl-flash": {
    service: "dashscope", model: "qwen3-vl-flash", baseUrlEnv: "DASHSCOPE_BASE_URL", apiKeyEnv: "DASHSCOPE_API_KEY",
    extra: { enable_thinking: false }, jsonMode: false, vision: true,
  },
};

/**
 * O modelo padrão de cada etapa (as etapas estão na página "Modelos e avaliação" do painel); o valor é um dos nomes acima ou default. Etapas não listadas usam default.
 * Exemplo: { score: "glm-5.3-flash-selection", groupReview: "mimo-v2.6-flash" }
 */
export const DEFAULTS: Record<string, string> = {};
