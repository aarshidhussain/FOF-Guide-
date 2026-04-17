/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import Layout from './components/Layout';
import { AppTab, TreeSpecies, LibraryItem } from './lib/types';
import { TreeDeciduous, Book, MapPin, Search as SearchIcon, ArrowRight, X, Camera, Loader2, Info, GraduationCap, LogIn, User as UserIcon, Filter, Download, ExternalLink, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { identifyTree } from './lib/gemini';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { useAuth } from './components/FirebaseProvider';
import MapView from './components/MapView';

export default function App() {
  const { user, loading: authLoading, login, role } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<TreeSpecies | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<LibraryItem | null>(null);
  const [researchTypeFilter, setResearchTypeFilter] = useState<'all' | 'book' | 'paper' | 'thesis'>('all');
  const [isAddingSpecies, setIsAddingSpecies] = useState(false);
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [speciesList, setSpeciesList] = useState<TreeSpecies[]>([]);
  const [libraryList, setLibraryList] = useState<LibraryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedAbstracts, setExpandedAbstracts] = useState<string[]>([]);
  const [speciesSortBy, setSpeciesSortBy] = useState<'commonName' | 'scientificName'>('commonName');

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!user) return;

    const qSpecies = query(collection(db, 'species'), orderBy('commonName'));
    const unsubscribeSpecies = onSnapshot(qSpecies, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TreeSpecies));
      setSpeciesList(data);
      setDataLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'species');
    });

    const qLibrary = query(collection(db, 'library'), orderBy('title'));
    const unsubscribeLibrary = onSnapshot(qLibrary, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryItem));
      setLibraryList(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'library');
    });

    return () => {
      unsubscribeSpecies();
      unsubscribeLibrary();
    };
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsIdentifying(true);
    setAiResult(null);
    setActiveTab('species');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await identifyTree(base64);
        setAiResult(result || 'Could not identify species.');
        setIsIdentifying(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsIdentifying(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50">
        <Loader2 className="w-12 h-12 text-forest-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-forest-50">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-forest-100 max-w-sm w-full text-center space-y-6">
          <div className="bg-forest-100 p-4 rounded-full w-fit mx-auto">
            <TreeDeciduous className="w-12 h-12 text-forest-700" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-forest-900 tracking-tight">Welcome to Forestry</h1>
            <p className="text-forest-600 font-medium mt-2">Forestry Companion</p>
          </div>
          <button 
            onClick={login}
            className="w-full bg-forest-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-forest-200 flex items-center justify-center gap-2 hover:bg-forest-800 transition-colors"
          >
            <LogIn className="w-5 h-5" /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-8">
            <section className="bg-forest-100 p-6 rounded-3xl border border-forest-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-2xl font-bold">Student Corner</h2>
                  <p className="text-xs text-forest-600 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" /> Welcome, {user.displayName?.split(' ')?.[0] || 'Scholar'}
                  </p>
                </div>
                <div className="bg-forest-900 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  {role}
                </div>
              </div>
              <p className="text-forest-700 leading-relaxed font-medium mt-4">
                Explore the diverse forest flora and access library materials.
              </p>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab('species')}
                className="p-4 bg-white border border-forest-100 rounded-2xl flex flex-col gap-3 hover:bg-forest-50 transition-colors shadow-sm text-left group"
              >
                <div className="bg-forest-100 p-2 w-fit rounded-lg group-hover:bg-forest-200 transition-colors">
                  <TreeDeciduous className="w-6 h-6 text-forest-700" />
                </div>
                <span className="font-semibold text-sm">Tree Species</span>
              </button>
              <button 
                onClick={() => setActiveTab('library')}
                className="p-4 bg-white border border-forest-100 rounded-2xl flex flex-col gap-3 hover:bg-forest-50 transition-colors shadow-sm text-left group"
              >
                <div className="bg-forest-100 p-2 w-fit rounded-lg group-hover:bg-forest-200 transition-colors">
                  <Book className="w-6 h-6 text-forest-700" />
                </div>
                <span className="font-semibold text-sm">Library Hub</span>
              </button>
            </div>

            <section className="bg-forest-900 border border-forest-800 p-6 rounded-3xl text-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">AI Species Identifier</h3>
                <Camera className="w-5 h-5 text-forest-300" />
              </div>
              <p className="text-forest-300 text-sm mb-4">Take a photo of a tree to identify it instantly using AI.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-forest-200 text-forest-900 py-3 rounded-xl font-bold hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                Launch Scanner
              </button>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </section>

            <section>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <SearchIcon className="w-5 h-5" /> Recent Species
              </h3>
              <div className="space-y-4">
                {speciesList.slice(0, 3).map(species => (
                  <div 
                    key={species.id} 
                    onClick={() => setSelectedSpecies(species)}
                    className="bg-white p-4 rounded-2xl border border-forest-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-forest-300 transition-all active:scale-95"
                  >
                    <div>
                      <h4 className="font-bold">{species.commonName}</h4>
                      <p className="text-xs italic text-forest-500">{species.scientificName}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-forest-300" />
                  </div>
                ))}
                {speciesList.length === 0 && !dataLoading && <p className="text-center text-forest-400 py-4 italic">No species data synced yet.</p>}
              </div>
            </section>
          </div>
        );

      case 'species': {
        const filteredSpecies = speciesList
          .filter(s => 
            s.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.scientificName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .sort((a, b) => {
            if (speciesSortBy === 'commonName') {
              return a.commonName.localeCompare(b.commonName);
            } else {
              return a.scientificName.localeCompare(b.scientificName);
            }
          });
        return (
          <div className="space-y-6">
            <div className="bg-forest-900 text-white p-6 rounded-[2.5rem] relative overflow-hidden">
               <div className="relative z-10">
                 <div className="flex justify-between items-center mb-4">
                    <div className="bg-forest-800 p-2 rounded-2xl w-fit">
                      <Camera className="w-5 h-5 text-forest-200" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-forest-400">AI Identifier</span>
                 </div>
                 <h3 className="text-xl font-bold mb-2">Identify Any Species</h3>
                 <p className="text-forest-300 text-xs mb-6 leading-relaxed">
                   Upload a clear photo of leaves, bark, or fruit to identify trees instantly using our specialized forestry AI.
                 </p>
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full bg-white text-forest-900 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-forest-50 transition-all flex items-center justify-center gap-2"
                 >
                   <Upload className="w-4 h-4" />
                   Upload from Device
                 </button>
               </div>
               {/* Background Accents */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-forest-800 rounded-full -mr-16 -mt-16 blur-2xl opacity-40" />
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-forest-800 rounded-full -ml-12 -mb-12 blur-xl opacity-30" />
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by common or scientific name..."
                    className="w-full bg-forest-50 border border-forest-200 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all font-medium text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-forest-100 text-forest-700 rounded-2xl border border-forest-200 hover:bg-forest-200 transition-colors"
                  title="Identify from photo"
                >
                  <Camera className="w-6 h-6" />
                </button>
                {role === 'admin' && (
                  <button 
                    onClick={() => setIsAddingSpecies(true)}
                    className="p-2.5 bg-forest-900 text-white rounded-2xl border border-forest-800 hover:bg-forest-800 transition-colors"
                    title="Add new species"
                  >
                    <TreeDeciduous className="w-6 h-6" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 px-1">
                 <span className="text-[10px] font-black uppercase tracking-widest text-forest-400">Sort By:</span>
                 <div className="flex gap-2">
                   <button
                     onClick={() => setSpeciesSortBy('commonName')}
                     className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all border ${
                       speciesSortBy === 'commonName' 
                         ? 'bg-forest-900 text-white border-forest-900 shadow-md' 
                         : 'bg-white text-forest-600 border-forest-100 hover:border-forest-300'
                     }`}
                   >
                     Common Name
                   </button>
                   <button
                     onClick={() => setSpeciesSortBy('scientificName')}
                     className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all border ${
                       speciesSortBy === 'scientificName' 
                         ? 'bg-forest-900 text-white border-forest-900 shadow-md' 
                         : 'bg-white text-forest-600 border-forest-100 hover:border-forest-300'
                     }`}
                   >
                     Scientific Name
                   </button>
                 </div>
              </div>
            </div>

            {isIdentifying && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-forest-900 text-white p-6 rounded-3xl flex flex-col items-center gap-3 text-center"
              >
                <Loader2 className="w-8 h-8 animate-spin text-forest-300" />
                <p className="font-bold">Analyzing your image with AI...</p>
                <p className="text-xs text-forest-400">Comparing with Himalayan forest databases</p>
              </motion.div>
            )}

            {aiResult && !isIdentifying && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-forest-100 border border-forest-200 p-6 rounded-3xl relative"
              >
                <button 
                  onClick={() => setAiResult(null)}
                  className="absolute top-4 right-4 text-forest-400 hover:text-forest-600"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 mb-4 text-forest-800">
                  <Info className="w-5 h-5" />
                  <span className="font-bold">AI Analysis Result</span>
                </div>
                <div className="prose prose-sm text-forest-800">
                  <ReactMarkdown>{aiResult}</ReactMarkdown>
                </div>
              </motion.div>
            )}

            <div className="grid gap-4">
              {filteredSpecies.map(species => (
                <motion.div 
                    layout
                    key={species.id} 
                    onClick={() => setSelectedSpecies(species)}
                    className="bg-white rounded-3xl overflow-hidden border border-forest-100 shadow-sm cursor-pointer hover:border-forest-300 transition-all group"
                  >
                    <div className="h-40 relative">
                      <img 
                        src={species.imageUrl || `https://picsum.photos/seed/${species.scientificName}/600/400`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={species.commonName}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-forest-800 border border-white">
                        {species.scientificName}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold">{species.commonName}</h3>
                      <p className="text-sm font-medium text-forest-600 mb-4">{species.scientificName}</p>
                      <div className="flex items-start gap-2 text-xs text-forest-600 mb-4 bg-forest-50/50 p-3 rounded-xl border border-forest-100">
                        <MapPin className="w-4 h-4 shrink-0 text-forest-700" />
                        <span>{species.location.description}</span>
                      </div>

                      {species.description && (
                        <div className="mb-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-forest-400 mb-1">Description</h4>
                          <p className="text-xs text-forest-700 line-clamp-2 leading-relaxed">
                            {species.description}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                          {species.researchTopics?.slice(0, 2).map(topic => (
                            <span key={topic} className="px-3 py-1 bg-white text-forest-900 rounded-full text-[10px] font-semibold border border-forest-200">
                              {topic}
                            </span>
                          ))}
                          {species.researchTopics && species.researchTopics.length > 2 && (
                            <span className="text-[10px] text-forest-400 flex items-center">+ {species.researchTopics.length - 2} more</span>
                          )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              {filteredSpecies.length === 0 && !dataLoading && (
                <div className="text-center py-12 text-forest-400">
                  <TreeDeciduous className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No matches found in database</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'library':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Library Catalog</h2>
            <div className="grid gap-4">
              {libraryList.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border border-forest-100 shadow-sm flex gap-4 hover:border-forest-300 transition-colors">
                  <div className="bg-forest-100 p-3 rounded-2xl h-fit">
                    <Book className="w-6 h-6 text-forest-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold leading-tight flex-1">{item.title}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-forest-900 text-white rounded-md uppercase tracking-tighter ml-2">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-forest-600 mb-3">{item.author}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5 text-[10px] text-forest-500 font-bold bg-forest-50 px-2 py-1 rounded-lg">
                        <MapPin className="w-3 h-3" />
                        <span>{item.location}</span>
                      </div>
                      <span className="text-[10px] text-forest-400 font-medium">
                        {item.shelf}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {libraryList.length === 0 && (
                <p className="text-center text-forest-400 py-8 italic">No library items currently indexed.</p>
              )}
            </div>
          </div>
        );

      case 'research': {
        const researchItems = libraryList.filter(item => {
          if (researchTypeFilter === 'all') return true;
          return item.type === researchTypeFilter;
        });

        const filterOptions: { id: typeof researchTypeFilter; label: string }[] = [
          { id: 'all', label: 'All Research' },
          { id: 'paper', label: 'Papers' },
          { id: 'thesis', label: 'Theses' },
          { id: 'book', label: 'Books' },
        ];

        return (
          <div className="space-y-6">
            <div className="bg-forest-900 text-white p-8 rounded-3xl text-center relative overflow-hidden">
              <div className="relative z-10">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-forest-200" />
                <h2 className="text-2xl font-bold mb-2">Research Explorer</h2>
                <p className="text-forest-300 text-sm mb-6">Discover and contribute to the research database.</p>
                <button 
                  onClick={() => setIsAddingPaper(true)}
                  className="bg-white text-forest-900 px-6 py-2.5 rounded-full font-bold text-sm shadow-xl hover:bg-forest-50 transition-colors inline-flex items-center gap-2"
                >
                  <SearchIcon className="w-4 h-4 rotate-45" /> {/* Using Search tilted as a plus alternative or just finding a plus */}
                  Share Research
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-forest-800 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-forest-800 rounded-full -ml-12 -mb-12 blur-2xl opacity-50" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Filter className="w-4 h-4 text-forest-400 shrink-0 ml-1" />
                {filterOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setResearchTypeFilter(opt.id)}
                    className={`relative px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 ${
                      researchTypeFilter === opt.id
                        ? 'bg-forest-900 text-white border-forest-900 shadow-lg scale-105 ring-4 ring-forest-900/10'
                        : 'bg-white text-forest-600 border-forest-100 hover:border-forest-300 hover:bg-forest-50'
                    }`}
                  >
                    <span className="relative z-10">{opt.label}</span>
                    {researchTypeFilter === opt.id && (
                      <motion.div 
                        layoutId="activeFilterBar"
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-forest-900 rounded-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
              
              <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-lg font-bold">Results ({researchItems.length})</h3>
                </div>
                <div className="space-y-4">
                  {researchItems.map(paper => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={paper.id} 
                      onClick={() => setSelectedPaper(paper)}
                      className="p-5 bg-white border border-forest-100 rounded-[2rem] shadow-sm hover:border-forest-300 hover:bg-forest-50/50 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-forest-900 group-hover:text-forest-700 transition-colors leading-tight flex-1">{paper.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-forest-100 text-forest-700 rounded-lg uppercase tracking-wider ml-2 shrink-0">
                          {paper.type}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-forest-600 mb-3">By {paper.author} • {paper.year || 'N/A'}</p>
                      <p className={`text-xs text-forest-500 leading-relaxed italic border-l-2 border-forest-200 pl-3 ${expandedAbstracts.includes(paper.id!) ? '' : 'line-clamp-2'}`}>
                        {paper.abstract || 'Abstract currently being digitized for the research database...'}
                      </p>
                      {paper.abstract && paper.abstract.length > 100 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAbstract(paper.id!);
                          }}
                          className="text-[10px] font-bold text-forest-600 mt-1 hover:text-forest-900 underline decoration-forest-200 underline-offset-2 ml-3"
                        >
                          {expandedAbstracts.includes(paper.id!) ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-forest-400 group-hover:text-forest-900 transition-colors">
                          View full research abstract <ArrowRight className="w-3 h-3" />
                        </div>
                        {paper.downloadUrl && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(paper.downloadUrl, '_blank');
                            }}
                            className="bg-forest-100 p-2 rounded-lg text-forest-700 hover:bg-forest-200 transition-colors"
                            title="Download Paper"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {researchItems.length === 0 && (
                    <div className="text-center py-12 text-forest-400">
                      <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p>No material found for this category.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        );
      }

      case 'map':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Forestry Interactive Map</h2>
              <div className="bg-forest-100 px-3 py-1 rounded-full text-xs font-bold text-forest-700 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {speciesList.length} Markers
              </div>
            </div>
            
            <MapView 
              species={speciesList} 
              onSelectSpecies={(s) => setSelectedSpecies(s)} 
            />

            <div className="bg-forest-50 p-6 rounded-3xl border border-forest-100">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-forest-700" />
                Navigation Guide
              </h3>
              <p className="text-forest-600 text-xs leading-relaxed">
                The map markers show the exact location of research trees and plots. 
                Tap any marker to see the species name and access detailed research summaries.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Content for {activeTab}</div>;
    }
  };

  return (
    <div className="relative">
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>

      {/* Add Species Modal */}
      <AnimatePresence>
        {isAddingSpecies && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-forest-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Add New Species</h2>
                <button onClick={() => setIsAddingSpecies(false)} className="bg-forest-100 p-2 rounded-full"><X className="w-5 h-5"/></button>
              </div>
              <form 
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  try {
                    await addDoc(collection(db, 'species'), {
                      commonName: formData.get('commonName'),
                      scientificName: formData.get('scientificName'),
                      location: {
                        description: formData.get('location'),
                        lat: parseFloat(formData.get('lat') as string) || null,
                        lng: parseFloat(formData.get('lng') as string) || null,
                      },
                      researchSummary: formData.get('research'),
                      researchTopics: (formData.get('topics') as string).split(',').map(t => t.trim()),
                      createdAt: serverTimestamp()
                    });
                    setIsAddingSpecies(false);
                  } catch (error) {
                    handleFirestoreError(error, OperationType.CREATE, 'species');
                  }
                }}
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Common Name</label>
                  <input name="commonName" placeholder="e.g., Deodar Cedar" required className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Scientific Name</label>
                  <input name="scientificName" placeholder="e.g., Cedrus deodara" required className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Location Description</label>
                  <input name="location" placeholder="e.g., Block B, Near North Entrance" required className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Latitude (Optional)</label>
                    <input name="lat" type="number" step="any" placeholder="34.1234" className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Longitude (Optional)</label>
                    <input name="lng" type="number" step="any" placeholder="74.5678" className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Research Summary (Markdown)</label>
                  <textarea name="research" placeholder="Detailed botanical and silvicultural data..." className="w-full p-3 h-32 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Research Topics (Comma Separated)</label>
                  <input name="topics" placeholder="Silviculture, Wood Anatomy, Conservation" className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                </div>
                <button type="submit" className="w-full bg-forest-900 text-white py-4 rounded-xl font-bold">Save Species</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingPaper && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-forest-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-forest-900 tracking-tight">Share Research</h2>
                <button onClick={() => setIsAddingPaper(false)} className="bg-forest-100 p-2 rounded-full hover:bg-forest-200 transition-colors">
                  <X className="w-5 h-5 text-forest-700"/>
                </button>
              </div>
              <form 
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  try {
                    await addDoc(collection(db, 'library'), {
                      title: formData.get('title'),
                      author: formData.get('author'),
                      type: formData.get('type'),
                      location: formData.get('location'),
                      shelf: formData.get('shelf'),
                      year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
                      abstract: formData.get('abstract'),
                      downloadUrl: formData.get('downloadUrl') || null,
                      createdAt: serverTimestamp()
                    });
                    setIsAddingPaper(false);
                  } catch (error) {
                    handleFirestoreError(error, OperationType.CREATE, 'library');
                  }
                }}
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Research Title</label>
                  <input name="title" placeholder="e.g., Growth Patterns of Cedrus deodara" required className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Author</label>
                  <input name="author" placeholder="Researcher/Student Name" required className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Category</label>
                    <select name="type" className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium appearance-none" required>
                      <option value="paper">Research Paper</option>
                      <option value="thesis">Thesis</option>
                      <option value="book">Book</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Pub. Year</label>
                    <input name="year" type="number" placeholder="2024" className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Location</label>
                    <input name="location" placeholder="Library Hall" required className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Shelf Reference</label>
                    <input name="shelf" placeholder="Section-B4" required className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Abstract Summary</label>
                  <textarea name="abstract" placeholder="Key findings and research methodology..." className="w-full p-3 h-32 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-forest-400 uppercase ml-1">Digital Link (Optional)</label>
                  <input name="downloadUrl" type="url" placeholder="Direct link to PDF or Document" className="w-full p-3 rounded-xl border border-forest-100 bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-600 transition-all text-sm font-medium" />
                </div>
                <button type="submit" className="w-full bg-forest-900 border border-forest-800 text-white py-4 rounded-xl font-bold shadow-lg shadow-forest-900/10 hover:bg-forest-800 transition-all mt-4">
                  Submit to Archive
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Research Paper Detail Modal */}
      <AnimatePresence>
        {selectedPaper && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-forest-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setSelectedPaper(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg h-[80vh] sm:h-auto sm:max-h-[70vh] rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-forest-50 bg-forest-50/30 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-forest-900 text-white text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      {selectedPaper.type}
                    </span>
                    <span className="text-[10px] font-bold text-forest-400">Published {selectedPaper.year || 'N/A'}</span>
                  </div>
                  <h2 className="text-2xl font-bold leading-tight text-forest-900">{selectedPaper.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedPaper(null)}
                  className="bg-white p-2 rounded-full shadow-sm text-forest-400 hover:text-forest-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-forest-400 mb-1">Author / Lead Researcher</h4>
                  <p className="text-lg font-bold text-forest-700">{selectedPaper.author}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-forest-50 p-4 rounded-2xl border border-forest-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-forest-400 mb-1">Location</h4>
                    <p className="text-xs font-bold text-forest-800">{selectedPaper.location}</p>
                  </div>
                  <div className="bg-forest-50 p-4 rounded-2xl border border-forest-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-forest-400 mb-1">Accession/Shelf</h4>
                    <p className="text-xs font-bold text-forest-800">{selectedPaper.shelf}</p>
                  </div>
                </div>

                <div className="space-y-3">
                   <h3 className="text-md font-black uppercase tracking-widest text-forest-400">Abstract</h3>
                   <div className="prose prose-forest max-w-none prose-sm leading-relaxed text-forest-800 italic">
                     {selectedPaper.abstract || 'The abstract for this research paper is currently being processed and indexed into the Forestry Companion digital archive.'}
                   </div>
                </div>
              </div>

              <div className="p-8 bg-forest-50/50 border-t border-forest-100 flex gap-4">
                {selectedPaper.downloadUrl ? (
                  <button 
                    onClick={() => window.open(selectedPaper.downloadUrl, '_blank')}
                    className="flex-1 bg-forest-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-forest-800 shadow-xl shadow-forest-200 transition-all font-serif"
                  >
                    <Download className="w-5 h-5" /> Download Full Text
                  </button>
                ) : (
                  <button className="flex-1 bg-forest-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-forest-800 shadow-xl shadow-forest-200 transition-all font-serif">
                    Request Full Text <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button 
                  className="bg-white border border-forest-100 p-4 rounded-2xl text-forest-700 hover:bg-forest-50 transition-colors shadow-sm"
                  title="Share Link"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Species Detail Modal */}
      <AnimatePresence>
        {selectedSpecies && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-forest-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setSelectedSpecies(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-64 relative shrink-0">
                <img 
                  src={selectedSpecies.imageUrl || `https://picsum.photos/seed/${selectedSpecies.scientificName}/800/600`} 
                  className="w-full h-full object-cover"
                  alt={selectedSpecies.commonName}
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedSpecies(null)}
                  className="absolute top-6 right-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-1">{selectedSpecies.commonName}</h2>
                  <p className="text-lg italic text-forest-600">{selectedSpecies.scientificName}</p>
                </div>

                <div className="bg-forest-50 p-4 rounded-2xl border border-forest-100 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-forest-700 mt-1" />
                  <div>
                    <h4 className="font-bold text-sm">Location on Campus</h4>
                    <p className="text-sm text-forest-600 leading-snug">{selectedSpecies.location.description}</p>
                  </div>
                </div>

                {selectedSpecies.description && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-forest-900">Description</h3>
                    <p className="text-sm text-forest-700 leading-relaxed">{selectedSpecies.description}</p>
                  </div>
                )}

                {selectedSpecies.researchTopics && selectedSpecies.researchTopics.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-forest-400">Related Research Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSpecies.researchTopics.map(topic => (
                        <span key={topic} className="px-3 py-1 bg-forest-100 text-forest-700 rounded-full text-[10px] font-bold border border-forest-200">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 text-forest-900 border-t border-forest-50 pt-6">
                   <h3 className="text-xl font-bold flex items-center gap-2">
                     <Book className="w-5 h-5 text-forest-700" /> Research Data
                   </h3>
                   <div className="prose prose-forest max-w-none prose-sm">
                     <ReactMarkdown>{selectedSpecies.researchSummary || 'No detailed research data available yet.'}</ReactMarkdown>
                   </div>
                </div>

                <div className="pt-6 border-t border-forest-100 flex gap-4">
                  <button className="flex-1 bg-forest-900 text-white py-4 rounded-2xl font-bold hover:bg-forest-800 transition-colors shadow-lg shadow-forest-200">
                    Locate on Map
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
