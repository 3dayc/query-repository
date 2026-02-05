import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface SqlEditorProps {
    code: string;
    onChange: (code: string) => void;
    readOnly?: boolean;
    minimal?: boolean;
}

export function SqlEditor({ code, onChange, readOnly = false, minimal = false }: SqlEditorProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    return (
        <div className={`flex flex-col h-full bg-[#1e1e1e] rounded-lg border border-slate-700 overflow-hidden shadow-xl ${minimal ? 'border-0 shadow-none bg-transparent' : ''}`}>
            {!minimal && (
                <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-black/20">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500/80" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <span className="w-3 h-3 rounded-full bg-green-500/80" />
                        <span className="ml-2 text-xs text-slate-400 font-mono">Query Editor</span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-400 hover:text-cyan-400 theme-transition bg-white/5 hover:bg-white/10 rounded"
                    >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            )}

            <div className={`flex-1 overflow-auto custom-scrollbar font-mono text-sm relative ${minimal ? 'p-0' : ''}`}>
                <Editor
                    value={code}
                    onValueChange={readOnly ? () => { } : onChange}
                    highlight={(code) => highlight(code, languages.sql, 'sql')}
                    padding={minimal ? 10 : 20}
                    className="min-h-full font-mono"
                    readOnly={readOnly}
                    style={{
                        fontFamily: '"Fira Code", "Fira Mono", monospace',
                        fontSize: 14,
                        backgroundColor: minimal ? '#1e1e1e' : 'transparent', // Ensure background for minimal
                        minHeight: '100%',
                    }}
                    textareaClassName="focus:outline-none"
                />
            </div>
        </div>
    );
}
