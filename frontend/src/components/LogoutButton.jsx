import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";


const LogoutButton = ({children, className = ""})=>{
    const {logout} = useAuthStore()
    const navigate = useNavigate();

    const onLogout = async()=>{
        const loggedOut = await logout();

        if (loggedOut) {
            navigate("/", { replace: true });
        }
    }



    return (
        <button type="button" className={className} onClick={onLogout}>
            {children}
        </button>
    )
}

export default LogoutButton;
