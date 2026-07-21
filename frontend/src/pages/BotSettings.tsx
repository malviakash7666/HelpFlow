import React, { useState, useEffect } from 'react';
import { botService } from '../service/botService';
import type { BotConfig } from '../service/botService';
import { useToast } from '../context/ToastContext';
import {
  Bot,
  Copy,
  Check,
  RefreshCw,
  Globe,
  Plus,
  Trash2,
  Sliders,
  Code,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const BotSettings: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await botService.getBotConfig();
      if (res.success && res.data) {
        setConfig(res.data);
      }
    } catch (err) {
      toast.error('Failed to load bot settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const res = await botService.updateBotConfig(config);
      if (res.success) {
        toast.success('Bot configuration saved successfully!');
      }
    } catch (err) {
      toast.error('Failed to save bot settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleRotateKeys = async () => {
    if (!window.confirm('Are you sure you want to rotate public/secret keys? Existing embedded script tags must be updated.')) {
      return;
    }
    try {
      const res = await botService.rotateKeys();
      if (res.success) {
        toast.success('Bot API keys rotated!');
        setConfig((prev) => (prev ? { ...prev, publicKey: res.data.publicKey } : prev));
      }
    } catch (err) {
      toast.error('Failed to rotate keys.');
    }
  };

  const addDomain = () => {
    if (!newDomain.trim() || !config) return;
    const clean = newDomain.trim().toLowerCase().replace(/^(https?:\/\/)?/, '');
    if (config.allowedDomains.includes(clean)) {
      toast.error('Domain already in whitelist.');
      return;
    }
    setConfig({
      ...config,
      allowedDomains: [...config.allowedDomains, clean],
    });
    setNewDomain('');
  };

  const removeDomain = (domainToRemove: string) => {
    if (!config) return;
    setConfig({
      ...config,
      allowedDomains: config.allowedDomains.filter((d) => d !== domainToRemove),
    });
  };

  const getEmbedSnippet = () => {
    if (!config) return '';
    return `<script\n  src="${backendUrl}/widget/widget.js"\n  data-bot-id="${config.id}"\n  data-public-key="${config.publicKey}">\n</script>`;
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(getEmbedSnippet());
    setCopied(true);
    toast.success('Widget embed code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-sm font-medium">Loading Bot Settings...</span>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2.5 text-white tracking-tight">
            <Bot className="w-7 h-7 text-blue-500" />
            AI Bot & Widget Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure your AI assistant's persona, RAG parameters, domain whitelist security, and embeddable widget snippet.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Columns: Persona & Model Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Persona Card */}
          <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Bot className="w-4 h-4 text-blue-400" />
              Bot Persona & Appearance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Bot Display Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="bg-[#0f172a] border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl p-3 outline-none"
                  placeholder="AI Support Agent"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Theme Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.theme}
                    onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                    className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme}
                    onChange={(e) => setConfig({ ...config, theme: e.target.value })}
                    className="bg-[#0f172a] border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl p-3 outline-none flex-grow"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Welcome Greeting Message</label>
              <textarea
                rows={2}
                value={config.welcomeMessage}
                onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                className="bg-[#0f172a] border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl p-3 outline-none resize-none"
                placeholder="Hello! How can I assist you today?"
              />
            </div>
          </div>

          {/* Model Parameters Card */}
          <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Sliders className="w-4 h-4 text-indigo-400" />
              AI Model & RAG Hyperparameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Model Selection</label>
                <select
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="bg-[#0f172a] border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl p-3 outline-none"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost Effective)</option>
                  <option value="gpt-4o">GPT-4o (High Intelligence)</option>
                  <option value="llama-3.3-70b">Llama 3.3 70B (Open Weights)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Temperature: {config.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-3"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Max Answer Tokens</label>
                <input
                  type="number"
                  min="100"
                  max="4000"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value, 10) })}
                  className="bg-[#0f172a] border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl p-3 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Domain Security Whitelist Card */}
          <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Domain Security Whitelist
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-full font-semibold">
                Strict Origin Verification Enabled
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Only requests coming from these whitelisted origins will be allowed to initialize the widget or chat with your AI. Unlisted domains receive <span className="text-red-400 font-mono font-bold">403 Forbidden</span>.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                  placeholder="e.g. support.company.com or *.company.com"
                  className="w-full bg-[#0f172a] border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl pl-10 pr-3 py-3 outline-none"
                />
              </div>
              <button
                onClick={addDomain}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Domain
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {config.allowedDomains.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No domain restrictions set (Allows all origins).</span>
              ) : (
                config.allowedDomains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-2 bg-slate-900/90 border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-xl"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    {domain}
                    <button
                      onClick={() => removeDomain(domain)}
                      className="hover:text-red-400 transition-colors ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Widget Code Generator */}
        <div className="space-y-6">
          <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Code className="w-4 h-4 text-blue-400" />
              Embeddable Widget Snippet
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              Copy and paste this script tag into the HTML <code className="text-blue-400 font-mono">&lt;body&gt;</code> of your website.
            </p>

            <div className="relative">
              <pre className="bg-[#070b19] border border-slate-800 p-4 rounded-xl text-[11px] font-mono text-blue-300 overflow-x-auto whitespace-pre leading-relaxed">
                {getEmbedSnippet()}
              </pre>
              <button
                onClick={copySnippet}
                className="absolute top-3 right-3 p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg transition-colors border border-blue-500/30 cursor-pointer"
                title="Copy Script Snippet"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Public Bot ID:</span>
                <span className="font-mono text-slate-200 text-[11px]">{config.id}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Public Key:</span>
                <span className="font-mono text-slate-200 text-[11px] truncate max-w-[150px]">{config.publicKey}</span>
              </div>

              <button
                onClick={handleRotateKeys}
                className="w-full py-2.5 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-300 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                Rotate API Keys
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
