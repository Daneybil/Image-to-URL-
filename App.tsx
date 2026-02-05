
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { Camera, Upload, Share2, Image as ImageIcon, Copy, Check, Info, Trash2, ArrowLeft } from 'lucide-react';
import { compressImage, encodeShareLink, decodeShareLink, formatBytes } from './utils/imageUtils.ts';
import { generateImageDescription } from './services/geminiService.ts';
import { UploadedImage, ShareData } from './types.ts';

// --- Shared Components ---

const Navbar: React.FC = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-slate-700/50">
    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        <Share2 className="text-emerald-400" />
        SnapHost
      </Link>
      <div className="flex gap-4 items-center">
        <Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors">How it works</Link>
      </div>
    </div>
  </nav>
);

// --- Pages ---

const Home: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState<UploadedImage[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('snaphost_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Compress image for URL viability
      const compressedDataUrl = await compressImage(file);
      
      // 2. Optional: Generate AI description with Gemini
      const description = await generateImageDescription(compressedDataUrl);

      const newImage: UploadedImage = {
        id: crypto.randomUUID(),
        dataUrl: compressedDataUrl,
        name: file.name,
        timestamp: Date.now(),
        aiDescription: description,
        size: Math.round((compressedDataUrl.length * 3) / 4) // Approx size in bytes
      };

      const updatedHistory = [newImage, ...history].slice(0, 10); // Keep last 10
      setHistory(updatedHistory);
      localStorage.setItem('snaphost_history', JSON.stringify(updatedHistory));

      // 3. Prepare share data and navigate to detail view
      const shareData: ShareData = {
        v: '1',
        d: newImage.dataUrl,
        n: newImage.name,
        a: newImage.aiDescription
      };
      const hash = encodeShareLink(shareData);
      navigate(`/v/${hash}`);
    } catch (err) {
      console.error(err);
      alert("Failed to process image. Make sure it's a valid image file.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearHistory = () => {
    if (confirm("Clear your upload history?")) {
      setHistory([]);
      localStorage.removeItem('snaphost_history');
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
          Instant Image <span className="text-blue-500">Hosting</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Upload an image and get a permanent, sharable link instantly. No accounts, no database, just pure data.
        </p>
      </div>

      <div className="relative group">
        <label className={`
          flex flex-col items-center justify-center w-full h-64 
          border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-300
          ${isUploading ? 'bg-slate-800 border-emerald-500 animate-pulse' : 'bg-slate-800/50 border-slate-700 hover:border-blue-500 hover:bg-slate-800'}
        `}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <>
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-medium text-emerald-400">Optimizing & Encoding...</p>
              </>
            ) : (
              <>
                <div className="p-4 bg-blue-500/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-blue-500" />
                </div>
                <p className="mb-2 text-xl font-semibold text-slate-200">Click to upload or drag & drop</p>
                <p className="text-sm text-slate-400">PNG, JPG, WEBP (Max 10MB)</p>
              </>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {history.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ImageIcon className="text-emerald-400" size={24} />
              Recent Uploads
            </h2>
            <button 
              onClick={clearHistory}
              className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 text-sm"
            >
              <Trash2 size={16} /> Clear
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((img) => (
              <div key={img.id} className="glass-effect p-4 rounded-xl flex items-center gap-4 group">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 truncate">{img.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatBytes(img.size)} • {new Date(img.timestamp).toLocaleDateString()}</p>
                  <button 
                    onClick={() => {
                       const shareData: ShareData = { v: '1', d: img.dataUrl, n: img.name, a: img.aiDescription };
                       const hash = encodeShareLink(shareData);
                       navigate(`/v/${hash}`);
                    }}
                    className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    View & Share <Share2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Viewer: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (hash) {
      const decoded = decodeShareLink(hash);
      setData(decoded);
    }
  }, [hash]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) {
    return (
      <div className="pt-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Link Expired or Invalid</h2>
        <p className="text-slate-400 mb-8">The image data could not be recovered from this URL.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-colors">
          <ArrowLeft size={18} /> Back to Upload
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white flex items-center gap-1 mb-2 text-sm transition-colors">
            <ArrowLeft size={16} /> Upload New
          </button>
          <h1 className="text-2xl font-bold truncate max-w-md">{data.n}</h1>
          {data.a && <p className="text-slate-400 italic text-sm mt-1">"{data.a}"</p>}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={copyLink}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl transition-all active:scale-95"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Share Link'}
          </button>
        </div>
      </div>

      <div className="glass-effect p-2 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <img 
          src={data.d} 
          alt={data.n} 
          className="w-full h-auto rounded-xl object-contain max-h-[70vh]" 
        />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-effect p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-400">
            <Info size={20} /> How is this permanent?
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            SnapHost uses <b>Data URI Encoding</b>. Instead of uploading your image to a central server, the entire image data is embedded directly into the URL itself. This means the link <i>is</i> the image. As long as the link exists, the image is accessible forever.
          </p>
        </div>
        <div className="glass-effect p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-emerald-400">
            <ImageIcon size={20} /> AI Enhanced
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Every image uploaded is processed by <b>Google Gemini 3</b> to generate a meaningful context and smart ALT tags, making your shared links more descriptive and accessible for social media previews.
          </p>
        </div>
      </div>
    </div>
  );
};

const About: React.FC = () => (
  <div className="pt-32 px-4 max-w-2xl mx-auto">
    <h1 className="text-3xl font-bold mb-6">About SnapHost</h1>
    <div className="space-y-6 text-slate-300 leading-relaxed">
      <p>
        SnapHost is a "Serverless" image hosting platform. Traditional platforms store your images on a database and give you a short ID. If their servers go down, your links break.
      </p>
      <p>
        We take a different approach: <b>The URL contains the image.</b>
      </p>
      <ul className="list-disc pl-5 space-y-3 text-slate-400">
        <li><b>Privacy Focused:</b> Your images are never stored on our servers. They live in your browser and in the links you share.</li>
        <li><b>Permanent:</b> No expiry dates. No account needed.</li>
        <li><b>Compressed:</b> We use advanced canvas optimization to shrink images while maintaining visual quality, ensuring links stay within browser length limits.</li>
        <li><b>AI Integrated:</b> Gemini analyzes your image to provide metadata and accessibility descriptions.</li>
      </ul>
      <div className="pt-8">
        <Link to="/" className="text-blue-400 font-bold hover:underline">Start Uploading →</Link>
      </div>
    </div>
  </div>
);

// --- Main App ---

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/v/:hash" element={<Viewer />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        
        <footer className="py-12 px-4 text-center border-t border-slate-900 mt-20">
          <p className="text-slate-500 text-sm">
            Powered by Gemini AI & Client-Side Encoding. No backend. No tracking.
          </p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
