import { useState,useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUser} from './features/auth/authSlice'
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom'
import { useSelector } from 'react-redux';


import AuthPage from './pages/AuthPage'



function App() {
  const dispatch = useDispatch();
 
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  return (
    
    <BrowserRouter>
    <Routes>
      <Route path="/" element={isAuthenticated ?  <Navigate to="/dashboard"/>  : <AuthPage/>}/>
      
    </Routes>
    
    </BrowserRouter>
  )
}

export default App
