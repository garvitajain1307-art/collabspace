import "./Login.css";
import {useState} from "react"
import {useDispatch} from "react-redux"
import {useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"
import {setLoading,setUser,logoutUser,setError,clearError} from "../features/auth/authSlice"
import {Link} from "react-router-dom"

const Login = () => {

    const dispatch=useDispatch();
    const navigate=useNavigate();
    const {loading,error,user,isAuthenticated}=useSelector((state)=>state.auth);


    const [loginData, setLoginData] = useState({
      email: "",
      password: "", 
    });

    const handleLoginChange=(e)=>{
         dispatch(clearError());
        setLoginData({
            ...loginData,
            [e.target.name]:e.target.value,

        })

    }

    const handleLoginSubmit=async(e)=>{
        e.preventDefault();
        try{
            dispatch(setLoading());
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/login`, {
                 method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(loginData),
            });

            const data=await res.json();
            console.log(data);

            if (!data.success) {
                dispatch(setError(data.message || data.errors?.[0] || "Login failed"));
                setLoginData({
                    email: "",
                    password: "",
                });
                return;
            }

            dispatch(setUser(data.user));
        

            setLoginData({
                email: "",
                password: "",
            });

            
            navigate("/dashboard");
            
                
        } catch (error) {
            dispatch(setError("Something went wrong"));
        }
    }


    return (
      <div className="login">
        <div className="login-container">
          <div className="brand">
            <div className="brand-icon">
              <div className="logo-mark">
                <span></span>
                <span></span>
              </div>
            </div>
            <h2>CollabSpace</h2>
            <p>Your team's knowledge, together.</p>
          </div>

          <div className="divider"></div>

          <div className="login-header">
            <h1>Welcome back</h1>
            <p>Sign in to continue to your workspace.</p>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={loginData.email} onChange={handleLoginChange} placeholder="you@company.com" />
            </div>

            <div className="form-group">
              <div className="password-label">
                <label>Password</label>
                <a href="/forgot-password">Forgot password?</a>
              </div>

              <input type="password" name="password" placeholder="Enter your password" value={loginData.password} onChange={handleLoginChange}/>
            </div>

            <button type="submit">Sign in</button>
          </form>

          <div className="or-divider">
            <span>OR</span>
          </div>

          <button className="google-button" type="button">
            <span>G</span>
            Continue with Google
          </button>

          <p className="signup-link">
            Don't have an account? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>
    );
};

export default Login;