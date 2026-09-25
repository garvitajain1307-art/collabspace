import "./socket";
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import { useSelector } from 'react-redux';

import { useState,useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUser,logoutUser} from './features/auth/authSlice'




import Login from './pages/Login'
import Signup from './pages/Signup'
import CollaborationPage from "./pages/CollaborationPage";
import WorkspaceHome from "./pages/Workspace/WorkspaceHome";

import Dashboard from "./pages/Dashboard/Dashboard";


function App() {
  const dispatch = useDispatch();
  
 
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [authChecked, setAuthChecked] = useState(false);
  
//   console.log("CURRENT PATH:", window.location.pathname);
// console.log("AUTH:", isAuthenticated);
//   console.log("AUTH:", isAuthenticated);

 

   useEffect(() => {

    const getMe = async () => {
        try {

            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/v1/user/getMe`,
                {
                    credentials: "include",
                }
            );

            const data = await res.json();

            if (data.success) {
                dispatch(setUser(data.user));
            }

        } catch (error) {

            console.log(error);

        } finally {

            setAuthChecked(true);

        }
    };

    getMe();

}, [dispatch]);

    if (!authChecked) {
        return <div>Checking authentication...</div>;
    }
  
  return (
    
    
    <BrowserRouter>
    <Routes>
      <Route path="/"element={isAuthenticated? <Navigate to="/dashboard" replace />: <Login />}/>
      <Route path="/login" element={isAuthenticated    ? <Navigate to="/dashboard" replace />: <Login />}/>
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={ isAuthenticated ? <Dashboard />: <Navigate to="/login" replace />}/>
      <Route path="/collaboration/:documentId" element={isAuthenticated ? <CollaborationPage /> : <Navigate to="/login" replace />}/>
   <Route path="/workspace/:workspaceId" element={isAuthenticated ? <WorkspaceHome /> : <Navigate to="/login" replace /> }/>
    </Routes>
    
    </BrowserRouter>
  )
}

export default App
