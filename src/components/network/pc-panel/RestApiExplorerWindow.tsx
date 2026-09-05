import { useState } from 'react';
import { Code, Copy, Check, Play, Server, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleRestApiRequest, type RestApiResponse } from '@/lib/network/restApiMock';
import type { CanvasDevice } from '../networkTopology.types';

interface RestApiExplorerWindowProps {
  isDark: boolean;
  language: string;
  topologyDevices?: CanvasDevice[];
}

const TEMPLATE_ENDPOINTS = [
  { label: 'DNA Center - List Network Devices', method: 'GET', url: 'https://dnac/dna/intent/api/v1/network-device' },
  { label: 'DNA Center - Get Auth Token', method: 'POST', url: 'https://dnac/dna/system/api/v1/auth/token' },
  { label: 'DNA Center - Get Client Health', method: 'GET', url: 'https://dnac/dna/intent/api/v1/client-health' },
  { label: 'RESTCONF - GET Interfaces (YANG)', method: 'GET', url: 'https://router1/restconf/data/ietf-interfaces:interfaces' },
];

export function RestApiExplorerWindow({
  isDark,
  language,
  topologyDevices = [],
}: RestApiExplorerWindowProps) {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [url, setUrl] = useState('https://dnac/dna/intent/api/v1/network-device');
  const [headers, setHeaders] = useState('Content-Type: application/json\nx-auth-token: demo_token_123');
  const [body, setBody] = useState('{\n  "name": "Router-1",\n  "type": "netsim"\n}');
  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers');
  const [response, setResponse] = useState<RestApiResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const isTr = language === 'tr';

  const handleSend = () => {
    const headerLines = headers.split('\n');
    const headerMap: Record<string, string> = {};
    headerLines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        headerMap[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    });

    const res = handleRestApiRequest(method, url, headerMap, body, topologyDevices);
    setResponse(res);
  };

  const handleCopyJson = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 p-3 select-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className={`rounded-xl border p-3 flex flex-col flex-1 min-h-0 gap-3 ${isDark ? 'border-secondary-800 bg-secondary-950/60' : 'border-secondary-200 bg-white'}`}>
        
        {/* Header / Title */}
        <div className="flex items-center justify-between border-b pb-2 dark:border-secondary-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                {isTr ? 'REST API Explorer & DNA Center Intent Tester' : 'REST API Explorer & DNA Center Intent Tester'}
              </h2>
              <p className="text-[10px] opacity-60">SD-Access Intent API & RESTCONF Data Models</p>
            </div>
          </div>

          {/* Preset templates dropdown */}
          <select
            onChange={(e) => {
              const selected = TEMPLATE_ENDPOINTS.find(t => t.url === e.target.value);
              if (selected) {
                setMethod(selected.method as 'GET' | 'POST');
                setUrl(selected.url);
              }
            }}
            className={`text-xs px-2 py-1 rounded border outline-none font-mono ${
              isDark ? 'bg-secondary-900 border-secondary-700 text-sky-300' : 'bg-secondary-100 border-secondary-300 text-sky-700'
            }`}
          >
            <option value="">{isTr ? '-- Şablon DNA API Seç --' : '-- Select Preset DNA API --'}</option>
            {TEMPLATE_ENDPOINTS.map((tpl, i) => (
              <option key={i} value={tpl.url}>{tpl.label}</option>
            ))}
          </select>
        </div>

        {/* Request Address Bar */}
        <div className="flex items-center gap-2">
          <select
            role="combobox"
            value={method}
            onChange={(e) => setMethod(e.target.value as 'GET')}
            className={`text-xs font-bold px-2 py-1.5 rounded border outline-none font-mono ${
              method === 'GET' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
              method === 'POST' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
              method === 'PUT' ? 'bg-sky-500/20 text-sky-400 border-sky-500/40' : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://dnac/dna/intent/api/v1/network-device"
            className={`flex-1 text-xs font-mono px-3 py-1.5 rounded border outline-none ${
              isDark ? 'bg-secondary-900 border-secondary-700 text-white' : 'bg-secondary-50 border-secondary-300 text-slate-900'
            }`}
          />

          <Button
            size="sm"
            onClick={handleSend}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isTr ? 'İstek Gönder' : 'Send'}</span>
          </Button>
        </div>

        {/* Request Options & Tabs */}
        <div className="flex flex-col h-[35%] min-h-0 border rounded-lg overflow-hidden dark:border-secondary-800">
          <div className={`flex items-center gap-2 border-b px-2 py-1 text-[11px] font-bold ${
            isDark ? 'bg-secondary-900 border-secondary-800' : 'bg-secondary-100 border-secondary-200'
          }`}>
            <button
              onClick={() => setActiveTab('headers')}
              className={`px-2 py-0.5 rounded transition-colors ${activeTab === 'headers' ? 'bg-primary-500 text-white' : 'opacity-60 hover:opacity-100'}`}
            >
              Headers
            </button>
            <button
              onClick={() => setActiveTab('body')}
              className={`px-2 py-0.5 rounded transition-colors ${activeTab === 'body' ? 'bg-primary-500 text-white' : 'opacity-60 hover:opacity-100'}`}
            >
              Body (JSON)
            </button>
          </div>

          <div className="flex-1 p-2 min-h-0 overflow-auto">
            {activeTab === 'headers' ? (
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder="Content-Type: application/json"
                className={`w-full h-full text-xs font-mono bg-transparent outline-none resize-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              />
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{ "key": "value" }'
                className={`w-full h-full text-xs font-mono bg-transparent outline-none resize-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              />
            )}
          </div>
        </div>

        {/* Response Viewer */}
        <div className="flex-1 flex flex-col min-h-0 border rounded-lg overflow-hidden dark:border-secondary-800">
          <div className={`flex items-center justify-between px-3 py-1.5 border-b text-[11px] font-bold ${
            isDark ? 'bg-secondary-900 border-secondary-800' : 'bg-secondary-100 border-secondary-200'
          }`}>
            <div className="flex items-center gap-2">
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>{isTr ? 'Yanıt (Response)' : 'Response'}</span>
              {response && (
                <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {response.status} {response.statusText} ({response.executionTimeMs} ms)
                </span>
              )}
            </div>

            {response && (
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100 transition-opacity"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopied ? (isTr ? 'Kopyalandı' : 'Copied') : (isTr ? 'JSON Kopyala' : 'Copy JSON')}</span>
              </button>
            )}
          </div>

          <div className={`flex-1 p-2 font-mono text-xs overflow-auto custom-scrollbar ${
            isDark ? 'bg-secondary-950 text-emerald-400' : 'bg-slate-900 text-emerald-300'
          }`}>
            {response ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(response.data, null, 2)}</pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-30 gap-1 select-none">
                <Server className="w-8 h-8" />
                <span className="text-xs">{isTr ? 'İstek göndermek için "İstek Gönder" butonuna basın' : 'Click "Send" to execute REST API request'}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
