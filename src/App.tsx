import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { LanguageProvider } from './context/LanguageContext';
import Main from './page/Main';
import OAuthSuccess from './page/OAuthSuccess';
import OAuthFail from './page/OAuthFail';
import Profile from './page/Profile';

function Page1() { return <div className="p-8 text-2xl">Page 1 Content</div>; }
function Page2() { return <div className="p-8 text-2xl">Page 2 Content</div>; }
function Page3() { return <div className="p-8 text-2xl">Page 3 Content</div>; }

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
                        <Route path="/page1" element={<Page1 />}/>
                        <Route path="/page2" element={<Page2 />}/>
                        <Route path="/page3" element={<Page3 />}/>
                    </Routes>
                </BrowserRouter>
            </QueryClientProvider>
        </LanguageProvider>
    )
}

export default App;