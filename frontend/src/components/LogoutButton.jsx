import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";


const LogoutButton = ({children})=>{
    const {logout} = useAuthStore()
    const navigate = useNavigate();

    const onLogout = async()=>{
        const loggedOut = await logout();

        if (loggedOut) {
            navigate("/", { replace: true });
        }
    }



    return (
        <button className="btn btn-primary" onClick={onLogout}> 
            {children}
        </button>
    )
}

export default LogoutButton;
