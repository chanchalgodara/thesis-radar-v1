import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  Settings as SettingsIcon, 
  Plus, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  Filter, 
  RefreshCw,
  MoreHorizontal,
  Pin,
  Trash2,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  Edit,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { Thesis, Target as TargetType, DeepDive, generateTargets, refreshSignals, generateDeepDive, interpretThesis, executeSearch, suggestTheses, SuggestedThesis, WorkflowStep, generateMarketMap, MarketMap } from './services/geminiService';

// --- Components ---

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const variants = {
    primary: 'bg-brand-primary hover:bg-brand-accent text-white',
    secondary: 'bg-brand-surface hover:bg-brand-hover text-brand-faint border border-brand-border',
    ghost: 'hover:bg-brand-surface text-brand-muted hover:text-slate-200',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  };
  return (
    <button 
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant as keyof typeof variants]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-brand-card border border-brand-border rounded-xl p-6 hover:border-brand-muted/30 transition-all ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: any) => {
  const variants = {
    default: 'bg-brand-surface text-brand-muted border border-brand-border',
    strong: 'bg-brand-primary/10 text-brand-accent border border-brand-primary/20',
    moderate: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    weak: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${variants[variant as keyof typeof variants]}`}>
      {children}
    </span>
  );
};

const SignalIndicator = ({ score }: { score: number }) => {
  let colorClass = 'bg-brand-accent';
  if (score >= 80) colorClass = 'bg-red-400 shadow-[0_0_10px_rgba(208,72,72,0.4)]';
  else if (score >= 50) colorClass = 'bg-amber-400';
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colorClass}`} />
      <span className="font-mono font-medium text-slate-200">{score}</span>
    </div>
  );
};

// --- Screens ---

const Dashboard = ({ theses, stats, onNewThesis, onSelectThesis, onDeleteThesis, onToggleStatus }: any) => (
  <div className="space-y-12">
    <div className="flex justify-between items-end">
      <div>
        <h1 className="text-4xl font-display font-bold text-slate-100">Thesis Radar</h1>
        <p className="text-brand-muted mt-2">Active M&A theses and market monitoring.</p>
      </div>
      <Button onClick={onNewThesis} className="py-3 px-6 shadow-lg shadow-brand-primary/10">
        <Plus size={20} />
        New Thesis
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="flex flex-col gap-1 bg-blue-500/10 border-blue-500/20">
        <span className="text-xs text-blue-400 uppercase tracking-widest font-bold">Active Theses</span>
        <span className="text-3xl font-mono text-blue-300">{theses.filter((t: any) => t.is_active).length}</span>
      </Card>
      <Card className="flex flex-col gap-1 bg-purple-500/10 border-purple-500/20">
        <span className="text-xs text-purple-400 uppercase tracking-widest font-bold">Tracked Targets</span>
        <span className="text-3xl font-mono text-purple-300">{stats?.total_targets || 0}</span>
      </Card>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {theses.map((thesis: Thesis) => {
        const thesisStats = stats?.thesesStats?.find((s: any) => s.id === thesis.id);
        return (
          <Card key={thesis.id} className={`group relative transition-all ${!thesis.is_active ? 'opacity-60 grayscale' : ''}`} onClick={() => onSelectThesis(thesis)}>
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(thesis.id); }}
                className={`p-2 rounded-lg transition-all ${thesis.is_active ? 'text-brand-accent hover:bg-brand-primary/10' : 'text-brand-faint hover:bg-brand-surface'}`}
                title={thesis.is_active ? 'Deactivate Thesis' : 'Activate Thesis'}
              >
                {thesis.is_active ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteThesis(thesis.id); }}
                className="p-2 text-brand-faint hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex flex-col h-full">
              <h3 className="text-lg font-bold mb-2 group-hover:text-brand-accent transition-colors pr-16 text-slate-100">{thesis.title}</h3>
              <p className="text-brand-muted text-sm line-clamp-3 mb-6 flex-grow">{thesis.description}</p>
              <div className="flex justify-between items-center pt-4 border-t border-brand-border/50">
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-brand-faint uppercase font-bold">Targets</span>
                    <span className="text-sm font-mono text-brand-faint">{thesisStats?.targets_count || 0}</span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-brand-faint group-hover:text-brand-accent transition-colors" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  </div>
);

const ThesisEditor = ({ onSave, onCancel, apiKey }: any) => {
  const [mode, setMode] = useState<'selection' | 'manual'>('selection');
  const [suggestions, setSuggestions] = useState<SuggestedThesis[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [strategicConstraints, setStrategicConstraints] = useState('');
  const [formData, setFormData] = useState<Partial<Thesis>>({
    title: '',
    description: ''
  });

  const handleSuggest = async () => {
    if (!apiKey) {
      alert('Please add your Gemini API key in Settings first.');
      return;
    }
    setIsSuggesting(true);
    try {
      const data = await suggestTheses(apiKey, strategicConstraints);
      setSuggestions(data);
    } catch (error: any) {
      console.error("Failed to suggest theses", error);
      alert(`Failed to generate suggestions: ${error?.message || error}`);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSave = () => {
    if (formData.title && formData.description) {
      onSave(formData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">New Strategic Thesis</h1>
          <p className="text-brand-muted text-sm">Define a new area of interest or let AI suggest high-impact opportunities.</p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          <X size={20} />
        </Button>
      </div>

      <div className="flex gap-4 border-b border-brand-border pb-4">
        <button 
          onClick={() => setMode('selection')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'selection' ? 'bg-brand-card text-slate-100 shadow-none' : 'text-brand-muted hover:text-brand-faint'}`}
        >
          AI Suggestions
        </button>
        <button 
          onClick={() => setMode('manual')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'manual' ? 'bg-brand-card text-slate-100 shadow-none' : 'text-brand-muted hover:text-brand-faint'}`}
        >
          Create Myself
        </button>
      </div>

      {mode === 'selection' ? (
        <div className="space-y-6">
          {suggestions.length === 0 ? (
            <div className="bg-brand-surface border border-dashed border-brand-border rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto border border-brand-primary/20">
                <Sparkles size={24} className="text-brand-accent" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-100">Generate Strategic Opportunities</h3>
                <p className="text-sm text-brand-muted max-w-xs mx-auto">
                  Our AI will analyze Vercel's ecosystem and current market trends to suggest high-impact acquisition theses.
                </p>
              </div>
              <div className="space-y-6 pt-4">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Strategic Constraints (Optional)</label>
                  <textarea 
                    className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-accent transition-colors resize-none h-24 text-sm text-brand-faint"
                    placeholder="Suggest focus areas (e.g., 'Focus on companies sharing Vercel's existing customer base', 'Potential new customers', 'Limit on investment < $50M')..."
                    value={strategicConstraints}
                    onChange={e => setStrategicConstraints(e.target.value)}
                  />
                </div>
                <Button onClick={handleSuggest} disabled={isSuggesting} className="mx-auto w-full">
                  {isSuggesting ? <><RefreshCw size={18} className="animate-spin" /> Analyzing Markets...</> : 'Suggest Theses'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4">
                {suggestions.map((s, i) => (
                  <Card 
                    key={i} 
                    className="group hover:border-brand-accent/50 cursor-pointer transition-all bg-brand-card border-brand-border"
                    onClick={() => onSave({ title: s.title, description: s.description })}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-brand-accent transition-colors">{s.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-brand-faint uppercase font-bold">Relevance</span>
                        <span className="text-sm font-mono text-brand-accent font-bold">{s.relevance_score}%</span>
                      </div>
                    </div>
                    <p className="text-brand-muted text-sm mb-4 leading-relaxed">{s.description}</p>
                    <div className="bg-brand-primary/10 border border-brand-primary/20 p-3 rounded-lg">
                      <p className="text-[10px] text-brand-accent uppercase font-bold mb-1">AI Rationale</p>
                      <p className="text-xs text-brand-muted italic">{s.rationale}</p>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Strategic Constraints (Optional)</label>
                  <textarea 
                    className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-accent transition-colors resize-none h-24 text-sm text-brand-faint"
                    placeholder="Suggest focus areas (e.g., 'Focus on companies sharing Vercel's existing customer base', 'Potential new customers', 'Limit on investment < $50M')..."
                    value={strategicConstraints}
                    onChange={e => setStrategicConstraints(e.target.value)}
                  />
                  <p className="text-[10px] text-brand-faint italic">These constraints help narrow down the AI's strategic suggestions.</p>
                </div>
                <Button variant="secondary" onClick={handleSuggest} disabled={isSuggesting} className="w-full">
                  <RefreshCw size={16} className={isSuggesting ? 'animate-spin' : ''} />
                  Regenerate Suggestions
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card className="space-y-6 bg-brand-card border-brand-border">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Thesis Title</label>
            <input 
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-accent transition-colors text-slate-100"
              placeholder="e.g., Edge Database Expansion"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Strategic Description</label>
            <textarea 
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-4 focus:outline-none focus:border-brand-accent transition-colors resize-none h-40 shadow-none text-brand-faint leading-relaxed"
              placeholder="Describe the strategic rationale for this acquisition area..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={!formData.title || !formData.description}>
              Initialize Thesis
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

const Watchlist = ({ thesis, targets, onRefresh, onTargetClick, onBack, onTogglePin, onDismiss, onGenerateMarketMap, onAddTarget }: any) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pinned
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [newTargetName, setNewTargetName] = useState('');
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'company', 'stage', 'signal', 'top_signal', 'valuation', 'funding_stage_detail'
  ]);

  const allColumns = [
    { id: 'company', label: 'Company' },
    { id: 'stage', label: 'Stage / Size' },
    { id: 'signal', label: 'Signal' },
    { id: 'top_signal', label: 'Top Signal' },
    { id: 'client_overlap_current', label: 'Current Client Overlap' },
    { id: 'client_overlap_potential', label: 'Potential Client Overlap' },
    { id: 'product_rating', label: 'Product Rating' },
    { id: 'product_score', label: 'Product Score' },
    { id: 'valuation', label: 'Valuation' },
    { id: 'funding_stage_detail', label: 'Funding Stage Detail' },
    { id: 'current_investors', label: 'Current Investors' },
  ];

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };
  
  const filteredTargets = targets.filter((t: TargetType) => {
    if (t.is_dismissed) return false;
    if (filter === 'pinned') return t.is_pinned;
    return true;
  });

  const dismissedTargets = targets.filter((t: TargetType) => t.is_dismissed);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const handleAddTarget = async () => {
    if (!newTargetName.trim()) return;
    await onAddTarget(newTargetName);
    setNewTargetName('');
    setShowAddTarget(false);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
      setShowColumnSettings(false);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { onBack(); }} className="p-2">
            <ChevronRight size={20} className="rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100">{thesis.title}</h1>
            <p className="text-brand-muted text-sm max-w-2xl line-clamp-1">{thesis.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onGenerateMarketMap}>
            <Globe size={16} />
            Generate Market Map
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-brand-border pb-4">
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-brand-card text-slate-100 shadow-none' : 'text-brand-muted hover:text-brand-faint'}`}
          >
            All Targets ({targets.filter((t: any) => !t.is_dismissed).length})
          </button>
          <button 
            onClick={() => setFilter('pinned')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'pinned' ? 'bg-brand-card text-slate-100 shadow-none' : 'text-brand-muted hover:text-brand-faint'}`}
          >
            Pinned
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Button variant="secondary" onClick={(e: any) => { e.stopPropagation(); setShowColumnSettings(!showColumnSettings); }} className="py-1.5 text-xs">
              <SettingsIcon size={14} />
              Columns
            </Button>
            {showColumnSettings && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-brand-card border border-brand-border rounded-xl shadow-2xl p-4 w-64 space-y-3" onClick={e => e.stopPropagation()}>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Visible Columns</h4>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {allColumns.map(col => (
                    <label key={col.id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={visibleColumns.includes(col.id)}
                        onChange={() => toggleColumn(col.id)}
                        className="w-4 h-4 rounded border-brand-border bg-brand-surface text-brand-accent focus:ring-brand-accent/20"
                      />
                      <span className="text-xs text-brand-muted group-hover:text-slate-100 transition-colors">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={handleRefresh} disabled={isRefreshing} className="py-1.5 text-xs">
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Updating...' : 'Refresh Signals'}
          </Button>
          <div className="relative">
            <Button className="py-1.5 text-xs" onClick={() => setShowAddTarget(!showAddTarget)}>
              <Plus size={14} />
              Add Target
            </Button>
            {showAddTarget && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-brand-card border border-brand-border rounded-xl shadow-2xl p-4 w-80 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Company Name</label>
                  <input 
                    autoFocus
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-accent transition-colors text-slate-100"
                    placeholder="e.g., Supabase, Neon..."
                    value={newTargetName}
                    onChange={e => setNewTargetName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTarget()}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" className="text-xs py-1" onClick={() => setShowAddTarget(false)}>Cancel</Button>
                  <Button className="text-xs py-1" onClick={handleAddTarget} disabled={!newTargetName.trim()}>Research & Add</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-brand-muted font-bold border-b border-brand-border">
              <th className="px-4 py-3 w-10"></th>
              {visibleColumns.includes('company') && <th className="px-4 py-3">Company</th>}
              {visibleColumns.includes('stage') && <th className="px-4 py-3">Stage / Size</th>}
              {visibleColumns.includes('signal') && <th className="px-4 py-3">Signal</th>}
              {visibleColumns.includes('top_signal') && <th className="px-4 py-3">Top Signal</th>}
              {visibleColumns.includes('client_overlap_current') && <th className="px-4 py-3">Current Client Overlap</th>}
              {visibleColumns.includes('client_overlap_potential') && <th className="px-4 py-3">Potential Client Overlap</th>}
              {visibleColumns.includes('product_rating') && <th className="px-4 py-3">Product Rating</th>}
              {visibleColumns.includes('product_score') && <th className="px-4 py-3">Product Score</th>}
              {visibleColumns.includes('valuation') && <th className="px-4 py-3">Valuation</th>}
              {visibleColumns.includes('funding_stage_detail') && <th className="px-4 py-3">Funding Stage Detail</th>}
              {visibleColumns.includes('current_investors') && <th className="px-4 py-3">Current Investors</th>}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {filteredTargets.map((target: TargetType) => (
              <tr 
                key={target.id} 
                className="group hover:bg-brand-surface/50 transition-colors cursor-pointer"
                onClick={() => onTargetClick(target)}
              >
                <td className="px-4 py-4" onClick={e => { e.stopPropagation(); onTogglePin(target); }}>
                  <Pin size={16} className={`${target.is_pinned ? 'text-brand-accent fill-brand-accent' : 'text-brand-faint group-hover:text-brand-faint'}`} />
                </td>
                {visibleColumns.includes('company') && (
                  <td className="px-4 py-4 relative group/name">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-100 group-hover/name:text-brand-accent transition-colors">{target.name}</span>
                      <span className="text-xs text-brand-muted line-clamp-1">{target.one_liner}</span>
                    </div>
                    <div className="absolute left-4 top-full mt-1 hidden group-hover/name:block z-50 bg-brand-card border border-brand-border p-3 rounded-xl shadow-2xl w-64 text-xs text-brand-muted leading-relaxed pointer-events-none">
                      <p className="font-bold text-slate-100 mb-1">{target.name}</p>
                      <p>{target.one_liner}</p>
                    </div>
                  </td>
                )}
                {visibleColumns.includes('stage') && (
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-brand-faint">{target.stage}</span>
                      <span className="text-xs text-brand-muted">{target.headcount} ppl</span>
                    </div>
                  </td>
                )}
                {visibleColumns.includes('signal') && (
                  <td className="px-4 py-4">
                    <SignalIndicator score={target.signal_score} />
                  </td>
                )}
                {visibleColumns.includes('top_signal') && (
                  <td className="px-4 py-4 relative group/signal">
                    <span className="text-xs text-brand-muted line-clamp-2 max-w-xs">{target.top_signal}</span>
                    <div className="absolute left-4 top-full mt-1 hidden group-hover/signal:block z-50 bg-brand-card border border-brand-border p-3 rounded-xl shadow-2xl w-64 text-xs text-brand-muted leading-relaxed pointer-events-none">
                      {target.top_signal}
                    </div>
                  </td>
                )}
                {visibleColumns.includes('client_overlap_current') && (
                  <td className="px-4 py-4 text-xs text-brand-muted">{target.client_overlap_current || '-'}</td>
                )}
                {visibleColumns.includes('client_overlap_potential') && (
                  <td className="px-4 py-4 text-xs text-brand-muted">{target.client_overlap_potential || '-'}</td>
                )}
                {visibleColumns.includes('product_rating') && (
                  <td className="px-4 py-4">
                    <Badge variant="default">{target.product_rating || '-'}</Badge>
                  </td>
                )}
                {visibleColumns.includes('product_score') && (
                  <td className="px-4 py-4 text-sm font-mono text-brand-faint">{target.product_score || '-'}</td>
                )}
                {visibleColumns.includes('valuation') && (
                  <td className="px-4 py-4 text-sm font-mono text-brand-accent">{target.valuation || '-'}</td>
                )}
                {visibleColumns.includes('funding_stage_detail') && (
                  <td className="px-4 py-4 text-xs text-brand-muted">{target.funding_stage_detail || '-'}</td>
                )}
                {visibleColumns.includes('current_investors') && (
                  <td className="px-4 py-4 text-xs text-brand-muted max-w-[150px] truncate">{target.current_investors || '-'}</td>
                )}
                <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === target.id ? null : target.id); }}
                        className="p-2 text-brand-faint hover:text-slate-400"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {activeMenuId === target.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-brand-card border border-brand-border rounded-lg shadow-2xl w-40 overflow-hidden" onClick={e => e.stopPropagation()}>
                          <button className="w-full text-left px-4 py-2 text-xs hover:bg-brand-surface text-brand-faint flex items-center gap-2" onClick={() => { 
                            const headers = ["ID", "Name", "One Liner", "Stage", "Headcount", "Signal Score", "Top Signal", "Fit Rating"];
                            const row = [target.id, target.name, target.one_liner, target.stage, target.headcount, target.signal_score, target.top_signal, target.fit_rating];
                            const csvContent = [headers.join(','), row.map(v => `"${v}"`).join(',')].join('\n');
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${target.name}_intel.csv`;
                            a.click();
                            setActiveMenuId(null); 
                          }}>
                            <Download size={12} /> Export Intelligence (CSV)
                          </button>
                          <button className="w-full text-left px-4 py-2 text-xs hover:bg-red-500/10 text-red-400 flex items-center gap-2" onClick={() => { onDismiss(target); setActiveMenuId(null); }}>
                            <Trash2 size={12} /> Delete Target
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dismissedTargets.length > 0 && (
        <div className="pt-8 opacity-50">
          <h3 className="text-xs font-bold uppercase tracking-widest text-brand-faint mb-4">Graveyard ({dismissedTargets.length})</h3>
          <div className="space-y-2">
            {dismissedTargets.map((target: TargetType) => (
              <div key={target.id} className="flex items-center justify-between p-3 bg-brand-surface/50 rounded-lg border border-brand-border">
                <span className="text-sm font-medium text-slate-400">{target.name}</span>
                <Button variant="ghost" size="sm" onClick={() => onDismiss(target)}>Restore</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DeepDiveView = ({ target, thesis, dive, onBack, onUpdate }: any) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    await onUpdate();
    setIsUpdating(false);
  };

  if (!dive) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
      <p className="text-brand-muted font-mono text-sm">Conducting deep dive research...</p>
    </div>
  );

  const renderBullets = (items: string[] | string | undefined, dense: boolean = false) => {
    if (!items) return null;
    
    let bullets: string[] = [];
    if (Array.isArray(items)) {
      bullets = items;
    } else {
      bullets = items.split('\n').filter(line => line.trim().length > 0);
    }
    
    return (
      <ul className={dense ? "space-y-2" : "space-y-4"}>
        {bullets.map((b, i) => {
          const content = b.replace(/^[-*•\d.]+\s*/, '').replace(/\*\*/g, '');
          const parts = content.split(':');
          const headline = parts.length > 1 ? parts[0] : '';
          const body = parts.length > 1 ? parts.slice(1).join(':') : content;

          return (
            <li key={i} className={`flex gap-3 text-slate-400 leading-relaxed ${dense ? 'text-xs' : 'text-sm'}`}>
              <span className="text-brand-accent shrink-0 mt-1.5">•</span>
              <div>
                {headline && headline.length < 50 && <span className={`font-bold text-slate-100 block ${dense ? 'mb-0.5' : 'mb-1'}`}>{headline}</span>}
                <span>{headline && headline.length >= 50 ? content : body}</span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ChevronRight size={20} className="rotate-180" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-display font-bold text-slate-100">{target.name}</h1>
              <Badge variant={target.fit_rating.toLowerCase()}>{target.fit_rating} Fit</Badge>
            </div>
            <p className="text-brand-muted mt-1">{target.one_liner}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="space-y-6 bg-blue-500/5 border-blue-500/20">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Signal Score Analysis</h4>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-mono font-bold text-blue-300">{target.signal_score}</span>
                <span className="text-blue-400 text-sm mb-1">/ 100</span>
              </div>
              {renderBullets(target.top_signal, true)}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="space-y-4 bg-brand-primary/10/50 border-brand-primary/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-accent flex items-center gap-2">
                <Target size={14} />
                Strategic Fit
              </h3>
              {renderBullets(dive.strategic_fit, true)}
            </Card>
            <Card className="space-y-4 bg-indigo-500/5 border-indigo-500/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Sparkles size={14} />
                Product Alignment Signals
              </h3>
              {renderBullets(dive.product_alignment_signals, true)}
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="space-y-4 bg-purple-500/10 border-purple-500/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <Plus size={14} />
                Team & Culture
              </h3>
              {renderBullets(dive.team, true)}
            </Card>
            <Card className="space-y-4 bg-rose-500/5 border-rose-500/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center gap-2">
                <Sparkles size={14} />
                Founders
              </h3>
              {renderBullets(dive.founders, true)}
            </Card>
          </div>

          <Card className="space-y-4 bg-brand-card border-brand-border overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-muted flex items-center gap-2 px-6 pt-6">
              <TrendingUp size={14} />
              Competitors Landscape
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-brand-faint font-bold border-b border-brand-border/50 bg-brand-surface/50">
                    <th className="px-6 py-3">Rank</th>
                    <th className="px-6 py-3">Company</th>
                    <th className="px-6 py-3">Details</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Funding</th>
                    <th className="px-6 py-3">Investors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {dive.competitors?.map((comp: any, i: number) => (
                    <tr key={i} className="hover:bg-brand-surface transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-brand-faint">{comp.rank}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-100">{comp.name}</td>
                      <td className="px-6 py-4 text-[10px] text-brand-accent uppercase font-bold">{comp.details}</td>
                      <td className="px-6 py-4 text-xs text-brand-muted max-w-xs">{comp.description}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">{comp.funding}</td>
                      <td className="px-6 py-4 text-[10px] text-brand-faint max-w-xs truncate">{comp.investors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="space-y-4 bg-amber-500/5 border-amber-500/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <SettingsIcon size={14} />
                Tech Stack
              </h3>
              {renderBullets(dive.product_tech, true)}
            </Card>
            <Card className="space-y-4 bg-red-500/5 border-red-500/20">
              <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                <ShieldAlert size={14} />
                Risks & Considerations
              </h3>
              {renderBullets(dive.risks, true)}
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="space-y-6 bg-brand-surface/50 border-brand-border">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Market Maturity & Timing</h4>
              {renderBullets(dive.timing)}
            </div>

            <div className="pt-6 border-t border-brand-border space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Key Financials</h4>
              <div className="bg-brand-card rounded-xl overflow-hidden border border-brand-border">
                <table className="w-full text-left text-xs">
                  <tbody className="divide-y divide-brand-border">
                    <tr>
                      <td className="px-4 py-2 text-brand-muted font-medium">Valuation</td>
                      <td className="px-4 py-2 text-brand-accent font-mono font-bold">{target.valuation || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-brand-muted font-medium">Stage</td>
                      <td className="px-4 py-2 text-brand-faint">{target.funding_stage_detail || target.stage}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-brand-muted font-medium">Total Funding</td>
                      <td className="px-4 py-2 text-brand-faint font-mono">
                        {Array.isArray(dive.funding_investors) 
                          ? (dive.funding_investors.find(s => s.toLowerCase().includes('total funding'))?.split(':')?.[1]?.trim() || 'See details')
                          : (dive.funding_investors?.match(/Total Funding:\s*([^\n]+)/)?.[1] || 'See details')
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-6 border-t border-brand-border space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Funding & Investors</h4>
              <div className="bg-brand-card p-4 rounded-xl space-y-3 border border-brand-border/50">
                {renderBullets(dive.funding_investors, true)}
              </div>
            </div>

            <div className="pt-6 border-t border-brand-border space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Latest Cap Table</h4>
              <div className="bg-brand-card p-4 rounded-xl space-y-3 border border-brand-border/50">
                {renderBullets(dive.cap_table_shareholding, true)}
              </div>
            </div>

            <div className="pt-6 border-t border-brand-border space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Financial Estimates</h4>
              <div className="bg-brand-card p-4 rounded-xl space-y-3 border border-brand-border/50">
                {renderBullets(dive.financials, true)}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-brand-faint bg-brand-surface p-2 rounded">
                <AlertCircle size={12} />
                AI ESTIMATED DATA
              </div>
            </div>
          </Card>

          <Card className="space-y-4 bg-brand-surface/30 border-brand-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-muted">Investments & Acquisitions</h3>
            <div className="bg-brand-card p-4 rounded-xl space-y-3 border border-brand-border/50">
              {renderBullets(dive.investments_acquisitions, true)}
            </div>
          </Card>

          <Card className="space-y-4 bg-brand-surface/30 border-brand-border">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-muted">Comparable Transactions</h3>
            <div className="bg-brand-card p-4 rounded-xl space-y-3 border border-brand-border/50">
              {renderBullets(dive.comparables, true)}
            </div>
          </Card>
        </div>
      </div>

      <Card className="space-y-4 bg-brand-card border-brand-border">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-muted flex items-center gap-2">
          <LinkIcon size={14} />
          Sources & Grounding
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dive.sources?.split('\n').filter((s: string) => s.trim()).map((source: string, i: number) => {
            const cleanSource = source.replace(/^[-*•\d.]+\s*/, '').trim();
            if (!cleanSource) return null;
            const parts = cleanSource.split(':');
            const label = parts.length > 1 ? parts[0].trim() : cleanSource.split('/').pop() || cleanSource;
            const url = parts.length > 1 ? parts.slice(1).join(':').trim() : cleanSource;

            return (
              <a key={i} href={url.startsWith('http') ? url : `https://google.com/search?q=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-brand-surface border border-brand-border rounded-xl hover:border-brand-accent/50 hover:bg-brand-card transition-all group">
                <div className="w-10 h-10 bg-brand-card rounded-lg flex items-center justify-center text-brand-faint group-hover:text-brand-accent shrink-0 border border-brand-border/50">
                  <FileText size={20} />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-bold text-brand-faint truncate group-hover:text-slate-100">{label}</p>
                  <p className="text-[10px] text-brand-faint truncate">{url}</p>
                </div>
                <ExternalLink size={14} className="ml-auto text-brand-faint group-hover:text-brand-accent" />
              </a>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const Settings = ({ apiKey, onSaveKey }: any) => {
  const [key, setKey] = useState(apiKey || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSaveKey(key);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-100">Settings</h1>
        <p className="text-brand-muted">Configure your AI intelligence engine</p>
      </div>

      <Card className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold uppercase tracking-widest text-brand-faint">Google Gemini API Key</label>
            <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-xs text-brand-accent hover:text-brand-accent flex items-center gap-1">
              Get Key <ExternalLink size={12} />
            </a>
          </div>
          <div className="relative">
            <input 
              type="password"
              placeholder="Paste your API key here..."
              className="w-full bg-brand-surface border border-brand-border rounded-lg px-4 py-3 focus:outline-none focus:border-brand-accent transition-colors font-mono text-sm text-slate-100"
              value={key}
              onChange={e => setKey(e.target.value)}
            />
            {apiKey && !key && (
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-faint">
                •••• •••• •••• {apiKey.slice(-4)}
              </div>
            )}
          </div>
          <p className="text-xs text-brand-muted">
            Your key is stored locally in your browser and used only for requests to Google Gemini.
          </p>
        </div>

        <Button className="w-full py-3" onClick={handleSave} disabled={!key}>
          {isSaved ? <><CheckCircle2 size={18} /> Saved</> : 'Save Configuration'}
        </Button>
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-brand-muted">About Thesis Radar</h3>
        <p className="text-sm text-brand-muted leading-relaxed">
          Thesis Radar is a specialized tool for Corporate Development teams to move from reactive deal tracking to proactive strategic sourcing. 
          By combining natural language strategic theses with real-time AI signal monitoring, we help you identify the right targets at the right time.
        </p>
      </div>
    </div>
  );
};

const CalibrationScreen = ({ calibration, onConfirm, onCancel }: any) => {
  const [data, setData] = useState(calibration);
  const [newSignal, setNewSignal] = useState('');
  const [editingStep, setEditingStep] = useState<number | null>(null);

  const [signalPriorities, setSignalPriorities] = useState<Record<number, string>>(
    calibration.signals.reduce((acc: any, _: any, i: number) => ({ ...acc, [i]: 'Medium' }), {})
  );

  const handleUpdate = (updates: any) => {
    setData((prev: any) => ({ ...prev, ...updates }));
  };

  const handleParamUpdate = (key: string, value: string) => {
    handleUpdate({ parameters: { ...data.parameters, [key]: value } });
  };

  const toggleSignal = (signal: string) => {
    const newSignals = data.signals.includes(signal)
      ? data.signals.filter((s: string) => s !== signal)
      : [...data.signals, signal];
    handleUpdate({ signals: newSignals });
  };

  const addSignal = () => {
    if (newSignal.trim()) {
      handleUpdate({ signals: [...data.signals, newSignal.trim()] });
      setSignalPriorities(prev => ({ ...prev, [data.signals.length]: 'Medium' }));
      setNewSignal('');
    }
  };

  const updateSignalPriority = (index: number, priority: string) => {
    setSignalPriorities(prev => ({ ...prev, [index]: priority }));
  };

  const updateWorkflowStep = (index: number, updates: Partial<WorkflowStep>) => {
    const newWorkflow = [...data.workflow];
    newWorkflow[index] = { ...newWorkflow[index], ...updates };
    handleUpdate({ workflow: newWorkflow });
  };

  const updateTask = (stepIndex: number, taskIndex: number, value: string) => {
    const newWorkflow = [...data.workflow];
    const newTasks = [...newWorkflow[stepIndex].tasks];
    newTasks[taskIndex] = value;
    newWorkflow[stepIndex] = { ...newWorkflow[stepIndex], tasks: newTasks };
    handleUpdate({ workflow: newWorkflow });
  };

  const addTask = (stepIndex: number) => {
    const newWorkflow = [...data.workflow];
    newWorkflow[stepIndex].tasks.push('New task...');
    handleUpdate({ workflow: newWorkflow });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel} className="p-2">
          <X size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100">Thesis Calibration</h1>
          <p className="text-brand-muted text-sm">Refine the strategic lens and agentic behavior before deployment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Strategy & Parameters (Col 5) */}
        <div className="lg:col-span-5 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-brand-accent flex items-center gap-2">
                <ShieldAlert size={14} />
                Strategic Alignment
              </label>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-brand-surface rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${data.vercel_relevance_score > 70 ? 'bg-brand-primary' : data.vercel_relevance_score > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${data.vercel_relevance_score}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-brand-faint">{data.vercel_relevance_score}%</span>
              </div>
            </div>
            <textarea 
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-4 focus:outline-none focus:border-brand-accent transition-colors resize-none text-brand-faint leading-relaxed h-64 shadow-none font-sans text-sm"
              value={data.market_context}
              onChange={e => handleUpdate({ market_context: e.target.value })}
            />
          </section>

          <section className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Core Search Parameters</label>
            <div className="grid grid-cols-2 gap-4 bg-brand-surface p-4 rounded-xl border border-brand-border">
              <div className="space-y-1">
                <span className="text-[10px] text-brand-faint uppercase font-bold">Size Range</span>
                <input 
                  className="w-full bg-transparent border-b border-brand-border py-1 text-xs focus:outline-none focus:border-brand-accent transition-colors text-brand-faint"
                  value={data.parameters.size_range}
                  onChange={e => handleParamUpdate('size_range', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-brand-faint uppercase font-bold">Funding Stage</span>
                <input 
                  className="w-full bg-transparent border-b border-brand-border py-1 text-xs focus:outline-none focus:border-brand-accent transition-colors text-brand-faint"
                  value={data.parameters.funding_stage}
                  onChange={e => handleParamUpdate('funding_stage', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-brand-faint uppercase font-bold">Geography</span>
                <input 
                  className="w-full bg-transparent border-b border-brand-border py-1 text-xs focus:outline-none focus:border-brand-accent transition-colors text-brand-faint"
                  value={data.parameters.geography}
                  onChange={e => handleParamUpdate('geography', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-brand-faint uppercase font-bold">Technologies</span>
                <input 
                  className="w-full bg-transparent border-b border-brand-border py-1 text-xs focus:outline-none focus:border-brand-accent transition-colors text-brand-faint"
                  value={data.parameters.technologies}
                  onChange={e => handleParamUpdate('technologies', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Evaluation Signals</label>
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4 shadow-none">
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {data.signals.map((signal: string, i: number) => {
                  const parts = signal.split(':');
                  const category = parts.length > 1 ? parts[0].trim() : '';
                  const priority = signalPriorities[i] || 'Medium';

                  return (
                    <div key={i} className="flex flex-col gap-2 bg-brand-surface p-3 rounded-xl border border-brand-border/50 group hover:border-brand-accent/30 transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-grow flex items-center gap-2">
                          {category && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-brand-primary/10 text-brand-accent rounded border border-brand-primary/20">
                              {category}
                            </span>
                          )}
                          <input 
                            className="flex-grow bg-transparent text-sm text-brand-faint focus:outline-none font-medium"
                            value={signal}
                            onChange={e => {
                              const newSignals = [...data.signals];
                              newSignals[i] = e.target.value;
                              handleUpdate({ signals: newSignals });
                            }}
                          />
                        </div>
                        <select 
                          value={priority}
                          onChange={(e) => updateSignalPriority(i, e.target.value)}
                          className={`text-[10px] font-bold uppercase bg-brand-card border border-brand-border rounded px-2 py-1 focus:ring-0 cursor-pointer ${
                            priority === 'High' ? 'text-red-400' : priority === 'Medium' ? 'text-amber-400' : 'text-brand-faint'
                          }`}
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                        <button 
                          onClick={() => handleUpdate({ signals: data.signals.filter((_: any, idx: number) => idx !== i) })}
                          className="text-brand-faint hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input 
                  className="flex-grow bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-accent text-brand-faint"
                  placeholder="Add custom signal (e.g., People: Ex-CEO of...)"
                  value={newSignal}
                  onChange={e => setNewSignal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSignal()}
                />
                <Button variant="secondary" size="sm" onClick={addSignal}>
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Workflow Configuration (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold text-slate-100">Agent Workflow Configuration</h2>
            <Badge>Structured Deployment</Badge>
          </div>
          
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-6 shadow-none">
            {data.workflow.map((step: WorkflowStep, sIdx: number) => (
              <div key={sIdx} className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-accent font-mono text-sm font-bold shrink-0">
                    {sIdx + 1}
                  </div>
                  <div className="flex-grow space-y-4">
                    <div className="flex items-center justify-between">
                      {editingStep === sIdx ? (
                        <input 
                          autoFocus
                          className="bg-transparent text-lg font-bold text-slate-100 focus:outline-none border-b border-brand-accent/50 w-full mr-4"
                          value={step.title}
                          onChange={e => updateWorkflowStep(sIdx, { title: e.target.value })}
                          onBlur={() => setEditingStep(null)}
                          onKeyDown={e => e.key === 'Enter' && setEditingStep(null)}
                        />
                      ) : (
                        <h4 className="text-lg font-bold text-slate-100">{step.title}</h4>
                      )}
                      <button 
                        onClick={() => setEditingStep(editingStep === sIdx ? null : sIdx)}
                        className="p-1.5 text-brand-faint hover:text-brand-accent transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-[10px] text-brand-faint uppercase font-bold tracking-widest">Strategic Logic</span>
                      <textarea 
                        className="w-full bg-brand-surface border border-brand-border/50 rounded-lg px-3 py-2 text-xs text-brand-muted leading-relaxed resize-none h-auto min-h-[80px] focus:outline-none focus:border-brand-accent/30"
                        value={step.logic}
                        onChange={e => updateWorkflowStep(sIdx, { logic: e.target.value })}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-brand-faint uppercase font-bold tracking-widest">Execution Tasks</span>
                        <button onClick={() => addTask(sIdx)} className="text-brand-faint hover:text-brand-accent transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {step.tasks.map((task, tIdx) => (
                          <div key={tIdx} className="flex items-center gap-3 bg-brand-surface/50 p-2 rounded-lg border border-brand-border/50 group">
                            <div className="w-5 h-5 rounded bg-brand-card border border-brand-border/50 flex items-center justify-center text-[10px] font-mono text-brand-faint">
                              {String.fromCharCode(97 + tIdx)}
                            </div>
                            <input 
                              className="flex-grow bg-transparent text-xs text-brand-muted focus:outline-none h-auto py-1"
                              value={task}
                              onChange={e => updateTask(sIdx, tIdx, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {sIdx < data.workflow.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-px bg-brand-border/30 -ml-0.5" />
                )}
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Button className="w-full py-6 text-xl shadow-xl shadow-brand-primary/10 group" onClick={() => onConfirm(data)}>
              Deploy Agents
              <ArrowRight size={24} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketMapView = ({ thesis, marketMap, onBack }: any) => {
  if (!marketMap) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
      <p className="text-brand-muted font-mono text-sm">Generating market map intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ChevronRight size={20} className="rotate-180" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-100">Market Landscape</h1>
            <p className="text-brand-muted text-sm">Strategic cluster analysis for: <span className="text-brand-accent">{thesis.title}</span></p>
          </div>
        </div>
      </div>

      <div className="bg-brand-card border border-brand-border p-8 rounded-3xl shadow-xl relative overflow-hidden min-h-[600px]">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {marketMap.categories.map((cat: any, i: number) => (
            <div key={i} className="flex flex-col gap-4 p-6 rounded-2xl bg-brand-surface/50 border border-brand-border/50 hover:bg-brand-card hover:shadow-lg hover:shadow-black/10 transition-all group/card">
              <div className="flex items-start gap-3 mb-2 border-b border-brand-border/50 pb-4 relative group/header">
                <div className="w-1.5 h-8 bg-brand-primary/30 rounded-full shrink-0 group-hover/card:bg-brand-primary transition-colors" />
                <div className="cursor-help">
                  <h3 className="font-bold text-lg text-slate-100 leading-tight">{cat.name}</h3>
                  <div className="absolute left-0 top-full mt-2 hidden group-hover/header:block z-50 bg-brand-card border border-brand-border p-3 rounded-xl shadow-2xl w-64 text-xs text-brand-muted leading-relaxed">
                    {cat.description}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 content-start">
                {cat.companies.map((company: any, j: number) => (
                  <div key={j} className="group relative grow">
                    <div className="px-3 py-2 bg-brand-card border border-brand-border rounded-lg text-xs font-bold text-slate-200 hover:text-brand-accent hover:border-brand-accent/50 shadow-none transition-all cursor-help text-center w-full">
                      {company.name}
                    </div>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-brand-card border border-brand-border p-3 rounded-xl shadow-2xl w-48 text-[10px] text-brand-muted leading-relaxed text-center pointer-events-none">
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-card border-b border-r border-brand-border rotate-45" />
                      {company.rationale}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'dashboard' | 'editor' | 'calibration' | 'watchlist' | 'deepdive' | 'settings' | 'marketmap'>('dashboard');
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [selectedThesis, setSelectedThesis] = useState<Thesis | null>(null);
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TargetType | null>(null);
  const [deepDive, setDeepDive] = useState<DeepDive | null>(null);
  const [marketMap, setMarketMap] = useState<MarketMap | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<string[]>([]);
  const [currentLoadingStep, setCurrentLoadingStep] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchTheses();
    fetchStats();
  }, []);

  const fetchTheses = async () => {
    const res = await fetch('/api/theses');
    const data = await res.json();
    setTheses(data);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  };

  const fetchTargets = async (thesisId: string) => {
    const res = await fetch(`/api/theses/${thesisId}/targets`);
    const data = await res.json();
    setTargets(data);
  };

  const handleSaveKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
  };

  const handleCreateThesis = async (formData: Partial<Thesis>) => {
    if (!apiKey) {
      alert('Please add your Gemini API key in Settings before creating a thesis.');
      setView('settings');
      return;
    }

    const title = (formData.title ?? '').trim();
    const description = (formData.description ?? '').trim();
    if (!title || !description) {
      alert('Please provide a title and description for the thesis.');
      return;
    }

    setIsLoading(true);
    setLoadingSteps(['Analyzing Strategic Thesis...']);
    setCurrentLoadingStep(0);
    
    try {
      const id = crypto.randomUUID();
      const newThesis = { ...formData, title, description, id, is_active: 1 } as Thesis;
      
      fetch('/api/theses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThesis)
      }).catch(err => console.warn('Backend save failed (server may not be running):', err));

      const calibration = await interpretThesis(apiKey, newThesis);
      setCalibrationData(calibration);
      setSelectedThesis(newThesis);
      setView('calibration');
    } catch (error: any) {
      console.error("Thesis creation failed", error);
      const msg = error?.message || String(error);
      if (msg.includes('API key') || msg.includes('401') || msg.includes('403')) {
        alert('Invalid API key. Please check your Gemini API key in Settings.');
      } else {
        alert(`Failed to create thesis: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSearch = async (finalCalibration: any) => {
    if (!selectedThesis || !apiKey) return;
    
    setIsLoading(true);
    // Extract steps from structured workflow for the loading screen
    const steps = finalCalibration.workflow.map((s: WorkflowStep) => s.title);
    
    setLoadingSteps(steps);
    setCurrentLoadingStep(0);

    // Simulate step progression for UX
    const interval = setInterval(() => {
      setCurrentLoadingStep(prev => (prev + 1) % steps.length);
    }, 4000);

    try {
      const generatedTargets = await executeSearch(apiKey, finalCalibration);
      const targetsWithIds = generatedTargets.map(t => ({
        ...t,
        id: crypto.randomUUID(),
        thesis_id: selectedThesis.id,
        is_pinned: 0,
        is_dismissed: 0,
        last_updated: new Date().toISOString()
      }));

      await fetch('/api/targets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesis_id: selectedThesis.id, targets: targetsWithIds })
      });

      await fetchTheses();
      await fetchStats();
      setTargets(targetsWithIds as TargetType[]);
      setView('watchlist');
    } catch (error) {
      console.error("Search execution failed", error);
      alert("Search execution failed. This might be due to a timeout or API key issue. Please try again.");
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleRefreshSignals = async () => {
    if (!selectedThesis || !apiKey) return;
    
    const updates = await refreshSignals(apiKey, selectedThesis, targets);
    
    for (const update of updates) {
      await fetch(`/api/targets/${update.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal_score: update.signal_score,
          top_signal: update.top_signal
        })
      });
      
      await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: update.id,
          score: update.signal_score,
          signal_text: update.top_signal
        })
      });
    }
    
    await fetchTargets(selectedThesis.id);
  };

  const handleAddTarget = async (name: string) => {
    if (!selectedThesis || !apiKey) return;
    
    setIsLoading(true);
    setLoadingSteps(['Researching Company...', 'Evaluating Strategic Fit...', 'Analyzing Signals...']);
    setCurrentLoadingStep(0);

    try {
      // We'll use generateTargets but for a single company name
      const prompt = `Research the company "${name}" specifically for the M&A thesis: "${selectedThesis.title}: ${selectedThesis.description}".
      Identify if they are a match. If so, provide their details.
      
      Return a JSON object with:
      - name: Full company name
      - one_liner: A concise description of what they do
      - stage: Funding stage
      - headcount: Estimated number of employees
      - fit_rating: Strong, Moderate, or Weak
      - signal_score: 0-100
      - top_signal: A short, punchy sentence.
      - client_overlap_current: Estimate overlap with Vercel's customer base.
      - client_overlap_potential: Estimate future overlap.
      - product_rating: A descriptive rating.
      - product_score: 0-100.
      - valuation: Estimated current valuation.
      - funding_stage_detail: Specific last round info.
      - current_investors: Notable VC/Angel names.
      `;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              one_liner: { type: Type.STRING },
              stage: { type: Type.STRING },
              headcount: { type: Type.STRING },
              fit_rating: { type: Type.STRING, enum: ["Strong", "Moderate", "Weak"] },
              signal_score: { type: Type.NUMBER },
              top_signal: { type: Type.STRING },
              client_overlap_current: { type: Type.STRING },
              client_overlap_potential: { type: Type.STRING },
              product_rating: { type: Type.STRING },
              product_score: { type: Type.NUMBER },
              valuation: { type: Type.STRING },
              funding_stage_detail: { type: Type.STRING },
              current_investors: { type: Type.STRING },
            },
            required: ["name", "one_liner", "stage", "headcount", "fit_rating", "signal_score", "top_signal"],
          },
        },
      });

      const data = JSON.parse(response.text || "{}");
      const newTarget = {
        ...data,
        id: crypto.randomUUID(),
        thesis_id: selectedThesis.id,
        is_pinned: 0,
        is_dismissed: 0,
        last_updated: new Date().toISOString()
      };

      await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTarget)
      });

      await fetchTargets(selectedThesis.id);
    } catch (error) {
      console.error("Failed to add target", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTargetClick = async (target: TargetType) => {
    setSelectedTarget(target);
    setView('deepdive');
    setDeepDive(null);

    try {
      const res = await Promise.race([
        fetch(`/api/targets/${target.id}/deep-dive`),
        new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
      const existingDive = await res.json();

      if (existingDive && existingDive.content) {
        setDeepDive(typeof existingDive.content === 'string' ? JSON.parse(existingDive.content) : existingDive.content);
        return;
      }
    } catch (e) {
      console.warn('Cache lookup failed, generating fresh:', e);
    }

    if (!apiKey) {
      alert('Please add your Gemini API key in Settings to run deep dive research.');
      setView('settings');
      return;
    }

    const thesis = selectedThesis;
    if (!thesis) {
      alert('No thesis selected. Please select a thesis first.');
      setView('dashboard');
      return;
    }

    try {
      const newDive = await generateDeepDive(apiKey, thesis, target);
      setDeepDive(newDive);
      fetch('/api/deep-dives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          target_id: target.id,
          content: newDive
        })
      }).catch(err => console.warn('Failed to cache deep dive:', err));
    } catch (error: any) {
      console.error("Deep dive generation failed", error);
      alert(`Deep dive failed: ${error?.message || error}`);
      setView('watchlist');
    }
  };

  const handleGenerateMarketMap = async () => {
    if (!selectedThesis || !apiKey) return;
    setView('marketmap');
    setMarketMap(null);
    try {
      const data = await generateMarketMap(apiKey, selectedThesis, targets);
      setMarketMap(data);
    } catch (error) {
      console.error("Market map generation failed", error);
    }
  };

  const handleTogglePin = async (target: TargetType) => {
    const newPinned = target.is_pinned ? 0 : 1;
    await fetch(`/api/targets/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: newPinned })
    });
    setTargets(targets.map(t => t.id === target.id ? { ...t, is_pinned: newPinned } : t));
  };

  const handleDismiss = async (target: TargetType) => {
    const newDismissed = target.is_dismissed ? 0 : 1;
    await fetch(`/api/targets/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_dismissed: newDismissed })
    });
    setTargets(targets.map(t => t.id === target.id ? { ...t, is_dismissed: newDismissed } : t));
  };

  const handleToggleStatus = async (id: string) => {
    await fetch(`/api/theses/${id}/toggle`, { method: 'PATCH' });
    fetchTheses();
    fetchStats();
  };

  return (
    <div className="flex h-screen bg-brand-bg text-slate-100 overflow-hidden font-sans selection:bg-brand-accent/30">
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className="h-full bg-brand-card border-r border-brand-border flex flex-col shrink-0 relative z-50"
      >
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <Target size={20} className="text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-slate-100">Thesis Radar</span>
            </div>
          )}
          {isSidebarCollapsed && (
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-brand-primary/20 mx-auto">
              <Target size={20} className="text-white" />
            </div>
          )}
        </div>

        <nav className="flex-grow px-3 space-y-1 mt-4">
          <button 
            onClick={() => { setView('dashboard'); fetchTheses(); fetchStats(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${view === 'dashboard' ? 'bg-brand-primary/10 text-brand-accent' : 'text-brand-muted hover:bg-brand-surface hover:text-slate-100'}`}
          >
            <LayoutDashboard size={20} className={view === 'dashboard' ? 'text-brand-accent' : 'text-brand-faint group-hover:text-slate-400'} />
            {!isSidebarCollapsed && <span className="font-medium text-sm">Dashboard</span>}
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${view === 'settings' ? 'bg-brand-primary/10 text-brand-accent' : 'text-brand-muted hover:bg-brand-surface hover:text-slate-100'}`}
          >
            <SettingsIcon size={20} className={view === 'settings' ? 'text-brand-accent' : 'text-brand-faint group-hover:text-slate-400'} />
            {!isSidebarCollapsed && <span className="font-medium text-sm">Settings</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-brand-border/50">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-faint hover:bg-brand-surface hover:text-slate-400 transition-all"
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            {!isSidebarCollapsed && <span className="font-medium text-sm">Collapse</span>}
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto relative">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto min-h-screen flex flex-col">
          <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col items-center justify-center space-y-12 py-20"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto animate-bounce border border-brand-primary/20">
                  <TrendingUp size={32} className="text-brand-accent" />
                </div>
                <h3 className="text-2xl font-display font-bold tracking-tight text-slate-100">
                  {loadingSteps.length > 1 ? 'Agent Deployment Active' : 'Strategic Analysis Active'}
                </h3>
                <p className="text-brand-muted text-sm max-w-xs mx-auto">
                  {loadingSteps.length > 1 
                    ? 'Executing calibrated workflow across market intelligence nodes.' 
                    : 'Synthesizing market context and strategic alignment filters.'}
                </p>
              </div>

              {loadingSteps.length > 1 && (
                <div className="flex flex-col gap-4 w-full max-w-2xl">
                  {loadingSteps.map((step, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                      }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-xl border border-brand-border bg-brand-card flex items-center gap-6 relative overflow-hidden group shadow-none"
                    >
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-brand-faint uppercase tracking-widest w-12">Step {i+1}</span>
                        <RefreshCw size={18} className="text-brand-accent animate-spin" />
                      </div>

                      <div className="flex-grow">
                        <h4 className="font-bold text-slate-100">
                          {step}
                        </h4>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {loadingSteps.length === 1 && (
                <div className="w-64 h-1.5 bg-brand-border/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-1/2 h-full bg-brand-primary"
                  />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'dashboard' && (
                <Dashboard 
                  theses={theses} 
                  stats={stats}
                  onNewThesis={() => setView('editor')} 
                  onSelectThesis={(t: Thesis) => {
                    setSelectedThesis(t);
                    fetchTargets(t.id);
                    setView('watchlist');
                  }}
                  onDeleteThesis={async (id: string) => {
                    await fetch(`/api/theses/${id}`, { method: 'DELETE' });
                    fetchTheses();
                    fetchStats();
                  }}
                  onToggleStatus={handleToggleStatus}
                />
              )}
              {view === 'editor' && (
                <ThesisEditor 
                  onSave={handleCreateThesis} 
                  onCancel={() => setView('dashboard')} 
                  apiKey={apiKey}
                />
              )}
              {view === 'calibration' && calibrationData && (
                <CalibrationScreen 
                  calibration={calibrationData}
                  onConfirm={handleExecuteSearch}
                  onCancel={() => setView('dashboard')}
                />
              )}
              {view === 'watchlist' && selectedThesis && (
                <Watchlist 
                  thesis={selectedThesis} 
                  targets={targets} 
                  onRefresh={handleRefreshSignals}
                  onTargetClick={handleTargetClick}
                  onBack={() => { fetchTheses(); fetchStats(); setView('dashboard'); }}
                  onTogglePin={handleTogglePin}
                  onDismiss={handleDismiss}
                  onGenerateMarketMap={handleGenerateMarketMap}
                  onAddTarget={handleAddTarget}
                />
              )}
              {view === 'marketmap' && selectedThesis && (
                <MarketMapView 
                  thesis={selectedThesis}
                  marketMap={marketMap}
                  onBack={() => setView('watchlist')}
                />
              )}
              {view === 'deepdive' && selectedTarget && selectedThesis && (
                <DeepDiveView 
                  target={selectedTarget} 
                  thesis={selectedThesis}
                  dive={deepDive}
                  onBack={() => { fetchTheses(); fetchStats(); setView('watchlist'); }}
                  onUpdate={() => handleTargetClick(selectedTarget)}
                />
              )}
              {view === 'settings' && (
                <Settings apiKey={apiKey} onSaveKey={handleSaveKey} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
  );
}
