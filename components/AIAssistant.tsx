
import React from 'react';
import { AppState } from '../types';
import { askAssistant } from '../services/gemini';
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react';

interface AIAssistantProps {
  state: AppState;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ state }) => {
  const [messages, setMessages] = React.useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Olá! Sou o Fera Bot. Como posso ajudar com a gestão da sua produção hoje?' }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    const newHistory = [...messages, { role: 'user' as const, text: userMsg }];
    
    setInput('');
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await askAssistant(newHistory, state);
      setMessages(prev => [...prev, { role: 'bot', text: response || "Não obtive resposta." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: "Erro ao conectar com a inteligência central." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <div className="bg-slate-900 p-6 rounded-[32px] text-white flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Fera Bot</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Inteligência Operacional</p>
          </div>
        </div>
        <button onClick={() => setMessages([{role: 'bot', text: 'Histórico limpo. Como posso ajudar?'}])} className="text-slate-500 hover:text-white transition-colors">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[32px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-100 text-blue-600'}`}>
                  {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm font-medium ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-3 items-center text-slate-400">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Analisando dados...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <input 
            className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-bold text-slate-700"
            placeholder="Qual o status do estoque hoje?"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
