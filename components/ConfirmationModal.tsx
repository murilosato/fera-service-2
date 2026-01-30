
import React from 'react';
import { X, AlertTriangle, Trash2, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <Trash2 className="text-rose-600" size={24} />;
      case 'warning': return <AlertTriangle className="text-amber-600" size={24} />;
      case 'success': return <CheckCircle2 className="text-emerald-600" size={24} />;
      default: return <HelpCircle className="text-blue-600" size={24} />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-rose-600 hover:bg-rose-700';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700';
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700';
      default: return 'bg-slate-900 hover:bg-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
            {getIcon()}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{title}</h3>
            <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase opacity-80">{message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button 
              onClick={onClose}
              className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`py-3.5 px-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${getButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
