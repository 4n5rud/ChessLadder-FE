import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Main from './page/Main';
import OAuthSuccess from './page/OAuthSuccess';
import OAuthFail from './page/OAuthFail';
import Profile from './page/Profile';
import Ranking from './page/Ranking';
import News from './page/News';
import Header from './global/Header';
import Footer from './global/Footer';

function ComingSoon() { 
    const { t } = useLanguage();
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />
            <main className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                        {t('common.comingSoon')}
                    </h2>
                    <p className="text-gray-500 text-lg">
                        We are working hard to bring you this feature.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    ); 
}

// QueryClient 설정 및 LocalStorage 캐싱
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 10, // 10분
            gcTime: 1000 * 60 * 60, // 1시간 (이전 cacheTime)
        },
    },
});

// LocalStorage 캐싱 설정
const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
});

persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24시간
});

function App() {
    return(
        <LanguageProvider>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Main />}/>
                        <Route path="/oauth/success" element={<OAuthSuccess />}/>
                        <Route path="/oauth/fail" element={<OAuthFail />}/>
                        <Route path="/profile" element={<Profile />}/>
                        <Route path="/page1" element={<ComingSoon />}/>
                        <Route path="/news" element={<News />}/>
                        <Route path="/ranking" element={<Ranking />}/>
                    </Routes>
                </BrowserRouter>
            </QueryClientProvider>
        </LanguageProvider>
    )
}

export default App;