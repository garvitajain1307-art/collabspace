import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import { useSelector } from 'react-redux';

import { useState,useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUser} from './features/auth/authSlice'




import Login from './pages/Login'
import Signup from './pages/Signup'



function App() {
  const dispatch = useDispatch();
 
  const { isAuthenticated } = useSelector((state) => state.auth);
  
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
