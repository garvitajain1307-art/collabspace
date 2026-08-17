import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import { useSelector } from 'react-redux';

import { useState,useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUser} from './features/auth/authSlice'




import Login from './pages/Login'
import Signup from './pages/Signup'



function App() {
  const dispatch = useDispatch();
 
  const { user, isAuthenticated } = useSelector((state) => state.auth);

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
            }
        };

        getMe();
    }, []);
  
  return (
    
    <BrowserRouter>
    <Routes>
      <Route path="/"element={isAuthenticated? <Navigate to="/dashboard" replace />: <Login />}/>
      <Route path="/login" element={isAuthenticated    ? <Navigate to="/dashboard" replace />: <Login />}/>
      <Route path="/signup" element={<Signup />} />
      
    </Routes>
    
    </BrowserRouter>
  )
}

export default App
