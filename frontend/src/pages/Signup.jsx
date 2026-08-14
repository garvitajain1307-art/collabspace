
import "./Signup.css";
import {useState} from "react"
import {useDispatch} from "react-redux"
import {Link} from "react-router-dom"
import {useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"
import {setLoading,setUser,logoutUser,setError,clearError} from "../features/auth/authSlice"


const Signup = () => {

    const {loading,error}=useSelector((state)=>state.auth);

    const dispatch=useDispatch();
    const navigate=useNavigate();

    const [signupData,setSignupData]=useState({
        name:"",
        email:"",
        password:"",
        confirmPassword:""
    })

    const handleSignupChange=(e)=>{
        dispatch(clearError());
        setSignupData({
            ...signupData,
            [e.target.name]:e.target.value,
        })
    }
    const handleSignupSubmit=async(e)=>{
        e.preventDefault();
        try{
            dispatch(setLoading()) ;
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(signupData),
            }); 
            
            const data=await res.json();

            console.log(data);

            if (!data.success) {
                dispatch(setError(data.message || data.errors?.[0] || "Signup failed"));
                
                return;
            }

            setSignupData({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
            });

            dispatch(clearError());
        
            navigate("/login");
            
        }catch (error) {
            dispatch(setError("Something went wrong"));
        }

    }
    return (
        <div className="signup">
            <div className="signup-container">

                <div className="brand">
                    <div className="brand-icon">
                        <div className="logo-mark">
                            <span></span>
                            <span></span>
                        </div>
                    </div>

                    <h2>CollabSpace</h2>
                    <p>Bring your team's knowledge together.</p>
                </div>

                <div className="signup-header">
                    <h1>Create your account</h1>
                    <p>Start collaborating with your team.</p>
                </div>

                {error && <p className="auth-error">{error}</p>}

                <form className="signup-form" onSubmit={handleSignupSubmit}>

                    <div className="form-group">
                        <label>Full name</label>
                        <input type="text" name="name" placeholder="Ada Lovelace" value={signupData.name} onChange={handleSignupChange}/>
                    </div>

                    <div className="form-group"><label>Email address</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="you@company.com"
                            value={signupData.email}
                            onChange={handleSignupChange}
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={signupData.password}
                            onChange={handleSignupChange}
                        />

                        {/* <div className="password-requirements">
                            <p>○ At least 8 characters</p>
                            <p>○ One number</p>
                            <p>○ One special character</p>
                        </div> */}
                    </div>

                    <div className="form-group">
                        <label>Confirm password</label>

                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Re-enter your password"
                            value={signupData.confirmPassword}
                            onChange={handleSignupChange}
                        />
                    </div>

                    <button type="submit">
                        Create account
                    </button>

                </form>

                <div className="or-divider">
                    <span>OR</span>
                </div>

                <button className="google-button" type="button">
                    <span>G</span>
                    Continue with Google
                </button>

                <p className="signin-link">
                    Already have an account?{" "}
                    <Link to="/login">Sign in</Link>
                </p>

                <p className="signup-note">
                    You can create or join a workspace after signing up.
                </p>

            </div>
        </div>
    );
};

export default Signup;