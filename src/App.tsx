import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Main from './page/Main';
import OAuthSuccess from './page/OAuthSuccess';
import OAuthFail from './page/OAuthFail';
import Profile from './page/Profile';

function Page1() { return <div className="p-8 text-2xl">Page 1 Content</div>; }
function Page2() { return <div className="p-8 text-2xl">Page 2 Content</div>; }
function Page3() { return <div className="p-8 text-2xl">Page 3 Content</div>; }

function App() {
    return(
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
    )
}

export default App;